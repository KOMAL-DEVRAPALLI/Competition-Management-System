import mongoose from "mongoose";

import CompetitionEntry
    from "../../models/CompetitionEntry.js";

import LiveCompetition
    from "../../models/LiveCompetition.js";

import updateCompetitionResults
    from "../calculations/updateCompetitionResults.js";

import recalculateQueue
    from "./recalculateQueue.js";


// =====================================
// CORRECT COMPLETED ATTEMPT WEIGHT
//
// FEATURE 1
//
// Responsibility:
//
// 1. Validate live competition state.
// 2. Validate optimistic stateVersion.
// 3. Find the requested CompetitionEntry.
// 4. Validate requested phase/attempt.
// 5. Require the attempt to already be
//    completed.
// 6. Correct ONLY the recorded weight.
// 7. Recalculate athlete results.
// 8. Recalculate authoritative queue.
// 9. Increment stateVersion.
// 10. Return authoritative state.
//
// IMPORTANT:
//
// This is NOT a normal declaration change.
//
// Normal declaration editing:
//     PENDING attempt
//
// This service:
//     GOOD / NO_LIFT attempt
//
// It does NOT:
// - create an attempt
// - consume an attempt
// - change result
// - change performedAt
// - change performedSequence
// - advance competition
// - move platform athlete
// - manually reorder queue
//
// =====================================


const correctCompletedAttemptWeight = async ({
    entryId,
    competitionId,
    gender,
    phase,
    attemptNo,
    correctedWeight,
    expectedStateVersion,
}) => {

    // =====================================
    // REQUIRED INPUT
    // =====================================

    if (!entryId) {

        throw new Error(
            "Competition entry ID is required."
        );

    }


    if (!competitionId) {

        throw new Error(
            "Competition ID is required."
        );

    }


    if (!gender) {

        throw new Error(
            "Gender is required."
        );

    }


    if (
        !Number.isInteger(
            expectedStateVersion
        ) ||
        expectedStateVersion < 0
    ) {

        throw new Error(
            "expectedStateVersion must be a non-negative integer."
        );

    }


    // =====================================
    // PHASE VALIDATION
    // =====================================

    if (
        phase !== "SNATCH" &&
        phase !== "CLEAN_JERK"
    ) {

        throw new Error(
            "A valid competition phase is required: SNATCH or CLEAN_JERK."
        );

    }


    // =====================================
    // ATTEMPT NUMBER
    // =====================================

    const numericAttemptNo =
        Number(attemptNo);


    if (
        !Number.isInteger(
            numericAttemptNo
        ) ||
        numericAttemptNo < 1 ||
        numericAttemptNo > 3
    ) {

        throw new Error(
            "Attempt number must be 1, 2 or 3."
        );

    }


    // =====================================
    // WEIGHT VALIDATION
    // =====================================

    const weight =
        Number(correctedWeight);


    if (
        !Number.isFinite(weight) ||
        weight <= 0
    ) {

        throw new Error(
            "Invalid corrected weight."
        );

    }


    // =====================================
    // NORMALIZE GENDER
    // =====================================

    const normalizedGender =
        String(gender)
            .trim()
            .toLowerCase();


    // =====================================
    // TRANSACTION
    // =====================================

    const mongoSession =
        await mongoose.startSession();

    try {

        let result = null;


        await mongoSession.withTransaction(
            async () => {

                // =================================
                // LOAD LIVE SESSION
                // =================================

                const liveCompetition =
                    await LiveCompetition.findOne({

                        competitionId,

                        gender:
                            normalizedGender,

                    }).session(
                        mongoSession
                    );


                if (!liveCompetition) {

                    const error =
                        new Error(
                            "Live competition session not found."
                        );

                    error.code =
                        "LIVE_SESSION_NOT_FOUND";

                    error.statusCode =
                        404;

                    throw error;

                }


                // =================================
                // RUNNING STATE
                // =================================

                if (
                    liveCompetition.status !==
                    "RUNNING"
                ) {

                    throw new Error(
                        "Live competition is not currently running."
                    );

                }


                // =================================
                // RECOVERY SAFETY
                // =================================

                if (
                    liveCompetition.integrity?.status ===
                    "RECOVERY_REQUIRED"
                ) {

                    const error =
                        new Error(
                            "Live competition integrity requires recovery. Attempt correction is stopped."
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;

                }


                // =================================
                // STATE VERSION
                // =================================

                if (
                    !Number.isInteger(
                        liveCompetition.stateVersion
                    ) ||
                    liveCompetition.stateVersion < 0
                ) {

                    const error =
                        new Error(
                            "Live competition stateVersion is invalid. Recovery required."
                        );

                    error.code =
                        "RECOVERY_REQUIRED";

                    error.statusCode =
                        409;

                    throw error;

                }


                if (
                    expectedStateVersion !==
                    liveCompetition.stateVersion
                ) {

                    const error =
                        new Error(
                            "Live competition state has changed. Refresh before correcting the attempt."
                        );

                    error.code =
                        "STALE_STATE";

                    error.statusCode =
                        409;

                    error.expectedStateVersion =
                        expectedStateVersion;

                    error.currentStateVersion =
                        liveCompetition.stateVersion;

                    throw error;

                }


                // =================================
                // FIND COMPETITION ENTRY
                // =================================

                const competitionEntry =
                    await CompetitionEntry.findOne({

                        _id:
                            entryId,

                        competitionId,

                    }).session(
                        mongoSession
                    );


                if (!competitionEntry) {

                    const error =
                        new Error(
                            "Competition entry not found."
                        );

                    error.code =
                        "ENTRY_NOT_FOUND";

                    error.statusCode =
                        404;

                    throw error;

                }


                // =================================
                // SELECT AUTHORITATIVE HISTORY
                // =================================

                const attempts =
                    phase === "SNATCH"
                        ? competitionEntry.snatchAttempts
                        : competitionEntry.cleanJerkAttempts;


                if (
                    !Array.isArray(attempts)
                ) {

                    const error =
                        new Error(
                            `${phase} attempt history is missing.`
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;

                }


                // =================================
                // FIND EXACT ATTEMPT
                // =================================

                const attempt =
                    attempts.find(
                        (item) =>
                            Number(
                                item?.attemptNo
                            ) ===
                            numericAttemptNo
                    );


                if (!attempt) {

                    const error =
                        new Error(
                            `Authoritative ${phase} attempt ${numericAttemptNo} was not found.`
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;

                }


                // =================================
                // MUST BE COMPLETED
                // =================================

                if (
                    attempt.result !== "GOOD" &&
                    attempt.result !== "NO_LIFT"
                ) {

                    if (
                        attempt.result ===
                        "PENDING"
                    ) {

                        throw new Error(
                            "Only completed attempts can use the completed-attempt weight correction."
                        );

                    }


                    throw new Error(
                        "Attempt does not contain a valid completed result."
                    );

                }


                // =================================
                // EXECUTION HISTORY REQUIRED
                // =================================

                if (
                    !attempt.performedAt
                ) {

                    const error =
                        new Error(
                            "Completed attempt is missing performedAt. Recovery required."
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;

                }


                if (
                    !Number.isInteger(
                        attempt.performedSequence
                    ) ||
                    attempt.performedSequence < 1
                ) {

                    const error =
                        new Error(
                            "Completed attempt is missing a valid performedSequence. Recovery required."
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;

                }


                // =================================
                // CAPTURE ORIGINAL DATA
                // =================================

                const previousWeight =
                    attempt.declaredWeight ??
                    null;

                const previousResult =
                    attempt.result;

                const performedAt =
                    attempt.performedAt;

                const performedSequence =
                    attempt.performedSequence;


                // =================================
                // APPLY WEIGHT CORRECTION
                //
                // IMPORTANT:
                //
                // Only the recorded weight changes.
                //
                // Result and execution history
                // remain untouched.
                // =================================

                attempt.declaredWeight =
                    weight;


                // A correction is not a new declaration
                // event for a pending attempt.
                //
                // Do not modify declaredAt here.
                // The original declaration history is
                // preserved.


                // =================================
                // SAVE CORRECTED COMPETITION ENTRY
                //
                // IMPORTANT:
                //
                // The completed attempt was modified
                // above. Explicitly persist that
                // CompetitionEntry inside the same
                // transaction before recalculating
                // dependent state.
                // =================================

                await competitionEntry.save({

                    session:
                        mongoSession,

                });


                // =================================
                // RECALCULATE RESULTS
                // =================================

                await updateCompetitionResults(
                    competitionEntry,
                    mongoSession
                );


                // =================================
                // RECALCULATE QUEUE
                //
                // Read-only.
                //
                // Do NOT advance competition.
                // Do NOT assign currentEntryId.
                // Do NOT move platform athlete.
                // =================================

                const queueState =
                    await recalculateQueue({

                        competitionId,

                        gender:
                            normalizedGender,

                        dbSession:
                            mongoSession,

                        allowCurrentEntry:
                            false,

                    });


                // =================================
                // PRESERVE CURRENT PLATFORM STATE
                // =================================

                const currentEntryId =
                    liveCompetition.currentEntryId ??
                    null;

                const platformEntryId =
                    liveCompetition.platformEntryId ??
                    null;


                // =================================
                // INCREMENT STATE VERSION
                // =================================

                liveCompetition.stateVersion =
                    liveCompetition.stateVersion + 1;


                // =================================
                // SAVE LIVE SESSION
                // =================================

                await liveCompetition.save({

                    session:
                        mongoSession,

                });


                // =================================
                // RESULT
                // =================================

                result = {

                    competitionEntry,

                    liveCompetition,

                    competitionId,

                    gender:
                        normalizedGender,

                    phase,

                    attemptNo:
                        numericAttemptNo,

                    previousWeight,

                    correctedWeight:
                        weight,

                    result:
                        previousResult,

                    performedAt,

                    performedSequence,

                    currentEntryId,

                    platformEntryId,

                    nextAthlete:
                        queueState?.nextAthlete ??
                        null,

                    upcoming:
                        queueState?.upcoming ??
                        [],

                    queue:
                        queueState?.queue ??
                        [],

                    stateVersion:
                        liveCompetition.stateVersion,

                };

            }
        );


        // =====================================
        // DIAGNOSTIC LOG
        // =====================================

        console.log(
            "===================================="
        );

        console.log(
            "CORRECT COMPLETED ATTEMPT WEIGHT"
        );

        console.log(
            "Entry:",
            String(entryId)
        );

        console.log(
            "Competition:",
            String(competitionId)
        );

        console.log(
            "Gender:",
            normalizedGender
        );

        console.log(
            "Phase:",
            result.phase
        );

        console.log(
            "Attempt:",
            result.attemptNo
        );

        console.log(
            "Previous Weight:",
            result.previousWeight
        );

        console.log(
            "Corrected Weight:",
            result.correctedWeight
        );

        console.log(
            "Result:",
            result.result
        );

        console.log(
            "State Version:",
            result.stateVersion
        );

        console.log(
            "===================================="
        );


        return result;

    } finally {

        await mongoSession.endSession();

    }

};


export default correctCompletedAttemptWeight;