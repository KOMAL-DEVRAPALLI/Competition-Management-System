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
// CORRECT COMPLETED ATTEMPT RESULT
//
// FEATURE 2
//
// Corrects the recorded result of an
// already completed attempt.
//
// GOOD <-> NO_LIFT
//
// IMPORTANT:
//
// This is NOT normal lift processing.
//
// It does NOT:
// - create an attempt
// - consume another attempt
// - change attempt number
// - change declared weight
// - change declaredAt
// - change performedAt
// - change performedSequence
// - call advanceCompetition()
// - manually reorder the queue
//
// It ONLY changes:
//
//     attempt.result
//
// Then:
//
//     1. Competition results are updated.
//     2. Queue is recalculated.
//     3. Current athlete is updated from
//        authoritative queue result.
//     4. Platform follows the new current
//        athlete for this correction flow.
// =====================================


const correctCompletedAttemptResult = async ({
    entryId,
    competitionId,
    gender,
    phase,
    attemptNo,
    correctedResult,
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
    // RESULT VALIDATION
    // =====================================

    if (
        correctedResult !== "GOOD" &&
        correctedResult !== "NO_LIFT"
    ) {

        throw new Error(
            "Corrected result must be GOOD or NO_LIFT."
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
                        "LIVE_COMPETITION_NOT_FOUND";

                    error.statusCode =
                        404;

                    throw error;

                }


                // =================================
                // RECOVERY SAFETY
                // =================================

                if (
                    liveCompetition.status ===
                    "RECOVERY_REQUIRED"
                ) {

                    const error =
                        new Error(
                            "Live competition requires recovery. Result correction is stopped."
                        );

                    error.code =
                        "RECOVERY_REQUIRED";

                    error.statusCode =
                        409;

                    throw error;

                }


                if (
                    liveCompetition.integrity?.status ===
                    "RECOVERY_REQUIRED"
                ) {

                    const error =
                        new Error(
                            "Live competition integrity requires recovery. Result correction is stopped."
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
                    liveCompetition.stateVersion !==
                    expectedStateVersion
                ) {

                    const error =
                        new Error(
                            "Live competition state has changed. Refresh the Officials Screen and try again."
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
                // REMEMBER PREVIOUS STATE
                // =================================

                const previousCurrentEntryId =
                    liveCompetition.currentEntryId ??
                    null;


                const previousPlatformEntryId =
                    liveCompetition.platformEntryId ??
                    null;


                // =================================
                // LOAD COMPETITION ENTRY
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
                        "COMPETITION_ENTRY_NOT_FOUND";

                    error.statusCode =
                        404;

                    throw error;

                }


                // =================================
                // RESOLVE ATTEMPT HISTORY
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
                            "Attempt history is missing."
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
                            Number(item?.attemptNo) ===
                            numericAttemptNo
                    );


                if (!attempt) {

                    const error =
                        new Error(
                            `${phase} attempt ${numericAttemptNo} not found.`
                        );

                    error.code =
                        "ATTEMPT_NOT_FOUND";

                    error.statusCode =
                        404;

                    throw error;

                }


                // =================================
                // REQUIRE COMPLETED ATTEMPT
                // =================================

                if (
                    attempt.result !== "GOOD" &&
                    attempt.result !== "NO_LIFT"
                ) {

                    const error =
                        new Error(
                            "Only a completed GOOD or NO_LIFT attempt can be corrected."
                        );

                    error.code =
                        "ATTEMPT_NOT_COMPLETED";

                    error.statusCode =
                        400;

                    throw error;

                }


                // =================================
                // REQUIRE PERFORMED TIME
                // =================================

                if (
                    !attempt.performedAt
                ) {

                    const error =
                        new Error(
                            "Completed attempt is missing performedAt."
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;

                }


                // =================================
                // REQUIRE PERFORMED SEQUENCE
                // =================================

                if (
                    !Number.isInteger(
                        attempt.performedSequence
                    ) ||
                    attempt.performedSequence < 1
                ) {

                    const error =
                        new Error(
                            "Completed attempt is missing a valid performedSequence."
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;

                }


                // =================================
                // PREVIOUS RESULT
                // =================================

                const previousResult =
                    attempt.result;


                // =================================
                // DUPLICATE CORRECTION
                // =================================

                if (
                    previousResult ===
                    correctedResult
                ) {

                    const error =
                        new Error(
                            `Attempt is already recorded as ${correctedResult}.`
                        );

                    error.code =
                        "DUPLICATE_RESULT_CORRECTION";

                    error.statusCode =
                        400;

                    throw error;

                }


                // =================================
                // PRESERVE HISTORICAL DATA
                // =================================

                const performedAt =
                    attempt.performedAt;


                const performedSequence =
                    attempt.performedSequence;


                const declaredWeight =
                    attempt.declaredWeight;


                const declaredAt =
                    attempt.declaredAt;


                // =================================
                // CHANGE ONLY RESULT
                // =================================

                attempt.result =
                    correctedResult;


                // =================================
                // SAVE ENTRY
                // =================================

                await competitionEntry.save({

                    session:
                        mongoSession,

                });


                // =================================
                // RECALCULATE COMPETITION RESULTS
                // =================================

                await updateCompetitionResults(

                    competitionEntry,

                    mongoSession

                );


                // =================================
                // RECALCULATE QUEUE
                //
                // IMPORTANT:
                //
                // allowCurrentEntry = true
                //
                // because correcting a historical
                // result can change eligibility and
                // therefore change the authoritative
                // calling current.
                // =================================

                const queueState =
                    await recalculateQueue({

                        competitionId,

                        gender:
                            normalizedGender,

                        dbSession:
                            mongoSession,

                        allowCurrentEntry:
                            true,

                    });


                // =================================
                // AUTHORITATIVE NEW CURRENT
                // =================================

                const nextAthlete =
                    queueState?.nextAthlete ??
                    null;


                if (!nextAthlete) {

                    // =================================
                    // NO ELIGIBLE ATHLETE REMAINING
                    // =================================

                    liveCompetition.currentEntryId =
                        null;

                    liveCompetition.platformEntryId =
                        null;

                } else {

                    if (
                        !nextAthlete.entryId
                    ) {

                        const error =
                            new Error(
                                "Queue returned an athlete without a valid competition entry ID."
                            );

                        error.code =
                            "QUEUE_INTEGRITY_ERROR";

                        error.statusCode =
                            409;

                        throw error;

                    }


                    // =================================
                    // UPDATE CURRENT
                    // =================================
                    //
                    // Queue engine decides who is
                    // first.
                    // =================================

                    liveCompetition.currentEntryId =
                        nextAthlete.entryId;


                    // =================================
                    // UPDATE PLATFORM
                    // =================================
                    //
                    // For this correction workflow,
                    // the newly authoritative current
                    // athlete becomes the platform
                    // athlete shown by the Officials
                    // Screen.
                    //
                    // This fixes:
                    //
                    // CURRENT CALL: Hetvi
                    // CURRENT PLATFORM: Komal
                    //
                    // to:
                    //
                    // CURRENT CALL: Hetvi
                    // CURRENT PLATFORM: Hetvi
                    // =================================

                    liveCompetition.platformEntryId =
                        nextAthlete.entryId;

                }


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

                    previousResult,

                    correctedResult,

                    declaredWeight,

                    declaredAt,

                    performedAt,

                    performedSequence,

                    previousCurrentEntryId,

                    previousPlatformEntryId,

                    currentEntryId:
                        liveCompetition.currentEntryId ??
                        null,

                    platformEntryId:
                        liveCompetition.platformEntryId ??
                        null,

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
            "CORRECT COMPLETED ATTEMPT RESULT"
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
            "Previous Result:",
            result.previousResult
        );

        console.log(
            "Corrected Result:",
            result.correctedResult
        );

        console.log(
            "Previous Calling Current:",
            result.previousCurrentEntryId
                ?.toString() ??
            "NONE"
        );

        console.log(
            "New Calling Current:",
            result.currentEntryId
                ?.toString() ??
            "NONE"
        );

        console.log(
            "Previous Platform:",
            result.previousPlatformEntryId
                ?.toString() ??
            "NONE"
        );

        console.log(
            "New Platform:",
            result.platformEntryId
                ?.toString() ??
            "NONE"
        );

        console.log(
            "Next Athlete:",
            result.nextAthlete?.name ??
            null
        );

        console.log(
            "Performed Sequence:",
            result.performedSequence
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


export default correctCompletedAttemptResult;