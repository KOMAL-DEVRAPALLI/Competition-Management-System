import mongoose from "mongoose";

import CompetitionEntry
    from "../../models/CompetitionEntry.js";

import LiveCompetition
    from "../../models/LiveCompetition.js";

import getCurrentAttempt
    from "./getCurrentAttempt.js";

import recalculateQueue
    from "./recalculateQueue.js";


// =====================================
// SAVE / UPDATE ATHLETE DECLARATION
//
// AUTHORITATIVE STATE TRANSITION
//
// A declaration change can change the
// athlete's calling priority.
//
// IMPORTANT STATE SEPARATION:
//
// currentEntryId
//     = authoritative calling-current athlete
//
// platformEntryId
//     = athlete physically being processed
//
// Therefore a declaration correction may
// produce:
//
//     currentEntryId  = B
//     platformEntryId = C
//
// without moving C off the platform.
//
// Queue calculation remains entirely
// backend authoritative.
// =====================================


const saveDeclaration = async ({
    entryId,
    competitionId,
    gender,
    declaredWeight,
    expectedStateVersion,
}) => {

    // =====================================
    // VALIDATE REQUIRED DATA
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
        !Number.isInteger(expectedStateVersion) ||
        expectedStateVersion < 0
    ) {
        throw new Error(
            "expectedStateVersion must be a non-negative integer."
        );
    }


    // =====================================
    // VALIDATE DECLARED WEIGHT
    // =====================================

    const weight =
        Number(declaredWeight);

    if (
        !Number.isFinite(weight) ||
        weight <= 0
    ) {
        throw new Error(
            "Invalid declared weight."
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
    // START TRANSACTION
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
                // SESSION MUST BE RUNNING
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
                    liveCompetition.status ===
                    "RECOVERY_REQUIRED"
                ) {

                    const error =
                        new Error(
                            "Live competition requires recovery. Declaration changes are stopped."
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
                            "Live competition integrity requires recovery. Declaration changes are stopped."
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;
                }


                // =================================
                // VALIDATE CURRENT PHASE
                // =================================

                const currentPhase =
                    liveCompetition.currentPhase;


                if (
                    currentPhase !== "SNATCH" &&
                    currentPhase !== "CLEAN_JERK"
                ) {

                    const error =
                        new Error(
                            "Live competition current phase is invalid."
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;
                }


                // =================================
                // VALIDATE STATE VERSION
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
                            "Live competition state has changed. Refresh before changing the declaration."
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
                // CAPTURE STATE BEFORE MUTATION
                // =================================

                const previousCurrentEntryId =
                    liveCompetition.currentEntryId ??
                    null;

                const previousPlatformEntryId =
                    liveCompetition.platformEntryId ??
                    null;


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
                    throw new Error(
                        "Competition entry not found."
                    );
                }


                // =================================
                // RESOLVE ATHLETE'S NEXT ATTEMPT
                // =================================

                const currentAttempt =
                    getCurrentAttempt(
                        competitionEntry,
                        currentPhase
                    );


                if (
                    currentAttempt?.integrityError
                ) {

                    const error =
                        new Error(
                            `Athlete attempt history integrity check failed: ${currentAttempt.integrityError}`
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;
                }


                if (
                    !currentAttempt ||
                    currentAttempt.completed
                ) {

                    throw new Error(
                        `Athlete has no remaining ${currentPhase} attempts.`
                    );
                }


                if (
                    currentAttempt.phase !==
                    currentPhase
                ) {

                    const error =
                        new Error(
                            `Athlete's next attempt is ${currentAttempt.phase}, but the live session is currently in ${currentPhase}.`
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;
                }


                // =================================
                // VALIDATE ATTEMPT NUMBER
                // =================================

                if (
                    !Number.isInteger(
                        currentAttempt.attemptNo
                    ) ||
                    currentAttempt.attemptNo < 1 ||
                    currentAttempt.attemptNo > 3
                ) {

                    const error =
                        new Error(
                            "Athlete's next attempt number is invalid."
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;
                }


                // =================================
                // SELECT ATTEMPT ARRAY
                // =================================

                const attempts =
                    currentPhase === "SNATCH"
                        ? competitionEntry.snatchAttempts
                        : competitionEntry.cleanJerkAttempts;


                const attempt =
                    attempts.find(
                        (item) =>
                            item.attemptNo ===
                            currentAttempt.attemptNo
                    );


                if (!attempt) {

                    const error =
                        new Error(
                            `Authoritative ${currentPhase} attempt ${currentAttempt.attemptNo} was not found.`
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;
                }


                // =================================
                // ATTEMPT MUST BE PENDING
                // =================================

                if (
                    attempt.result !==
                    "PENDING"
                ) {

                    throw new Error(
                        "This attempt has already been completed."
                    );
                }


                // =================================
                // SAVE DECLARATION
                // =================================

                attempt.declaredWeight =
                    weight;

                attempt.declaredAt =
                    new Date();


                await competitionEntry.save({
                    session:
                        mongoSession,
                });


                // =================================
                // IMPORTANT
                //
                // EVERY VALID DECLARATION CHANGE
                // MUST RECALCULATE CALLING PRIORITY.
                //
                // The edited athlete does NOT need
                // to be the previous current athlete.
                //
                // The physical platform athlete is
                // preserved separately.
                // =================================

                const queueState =
                    await recalculateQueue({

                        competitionId,

                        gender:
                            normalizedGender,

                        dbSession:
                            mongoSession,

                        // Include current calling athlete
                        // in candidate evaluation.
                        //
                        // recalculateQueue remains read-only.
                        allowCurrentEntry:
                            true,

                    });


                const nextAthlete =
                    queueState?.nextAthlete ??
                    null;


                // =================================
                // VALIDATE RESULT OF QUEUE ENGINE
                // =================================

                if (!nextAthlete) {

                    const error =
                        new Error(
                            "No eligible athlete is available after the declaration change."
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;
                }


                if (!nextAthlete.entryId) {

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
// =====================================
// APPLY RECALCULATED CALLING ORDER
//
// Declaration changes may change who has
// the highest calling priority.
//
// IMPORTANT:
//
// currentEntryId:
//     follows the recalculated queue.
//
// platformEntryId:
//     remains the athlete physically on
//     the platform.
//
// A declaration save must NOT move the
// physical platform athlete.
// =====================================



liveCompetition.currentEntryId =
    nextAthlete.entryId;

liveCompetition.platformEntryId =
    nextAthlete.entryId;



                   // =================================
                // STATE VERSION
                // =================================

                liveCompetition.stateVersion =
                    liveCompetition.stateVersion + 1;


                // =================================
                // SAVE LIVE STATE
                // =================================

                await liveCompetition.save({
                    session:
                        mongoSession,
                });


                // =================================
                // RETURN AUTHORITATIVE RESULT
                // =================================

                result = {

                    competitionEntry,

                    liveCompetition,

                    stateVersion:
                        liveCompetition.stateVersion,

                    phase:
                        currentPhase,

                    attemptNo:
                        currentAttempt.attemptNo,

                    declaredWeight:
                        attempt.declaredWeight,

                    declaredAt:
                        attempt.declaredAt,

                    editedAthleteIsCurrent:
                        String(
                            previousCurrentEntryId ?? ""
                        ) ===
                        String(entryId),

                    previousCurrentEntryId,

                    currentEntryId:
                        liveCompetition.currentEntryId ??
                        null,

                    previousPlatformEntryId,

                    platformEntryId:
                        liveCompetition.platformEntryId ??
                        null,

                    queueState,

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
            "SAVE DECLARATION"
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
            "Declared Weight:",
            result.declaredWeight
        );

        console.log(
            "Previous Current:",
            result.previousCurrentEntryId
                ?.toString() ??
            "NONE"
        );

        console.log(
            "New Current:",
            result.currentEntryId
                ?.toString() ??
            "NONE"
        );

        console.log(
            "Platform:",
            result.platformEntryId
                ?.toString() ??
            "NONE"
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


export default saveDeclaration;