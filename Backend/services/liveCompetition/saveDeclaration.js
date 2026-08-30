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
// Responsibilities:
//
// 1. Validate request.
// 2. Load authoritative LiveCompetition.
// 3. Validate recovery/integrity state.
// 4. Validate stateVersion.
// 5. Load CompetitionEntry.
// 6. Resolve athlete's next attempt using
//    the LIVE COMPETITION CURRENT PHASE.
// 7. Validate that attempt belongs to
//    the active competition phase.
// 8. Save declaration.
// 9. If the edited athlete is currently
//    on the platform, recalculate the
//    authoritative calling order and update
//    currentEntryId when another athlete
//    now has priority.
// 10. Increment stateVersion atomically
//     inside the transaction.
//
// IMPORTANT:
//
// Declaration editing itself does NOT
// automatically advance the platform.
//
// However, when the declaration being
// changed belongs to the CURRENT athlete,
// that declaration may change the authoritative
// calling order.
//
// Therefore:
//
// CURRENT athlete declaration change
//     -> recalculate queue
//     -> determine authoritative current
//
// QUEUED athlete declaration change
//     -> recalculate derived queue only
//     -> currentEntryId remains unchanged
//
// Queue calculation remains in the backend.
// React never selects the athlete.
//
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


    // =====================================
    // VALIDATE EXPECTED STATE VERSION
    // =====================================

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
    // VALIDATE DECLARED WEIGHT
    // =====================================

    const weight =
        Number(
            declaredWeight
        );


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

        let result;


        await mongoSession.withTransaction(
            async () => {

                // =====================================
                // FIND LIVE COMPETITION
                // =====================================

                const liveCompetition =
                    await LiveCompetition.findOne({

                        competitionId,

                        gender:
                            normalizedGender,

                    }).session(
                        mongoSession
                    );


                if (!liveCompetition) {

                    throw new Error(
                        "Live competition session not found."
                    );

                }


                // =====================================
                // LIVE SESSION MUST BE RUNNING
                // =====================================

                if (
                    liveCompetition.status !==
                    "RUNNING"
                ) {

                    throw new Error(
                        "Live competition is not currently running."
                    );

                }


                // =====================================
                // RECOVERY SAFETY
                // =====================================

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


                // =====================================
                // INTEGRITY SAFETY
                // =====================================

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


                // =====================================
                // VALIDATE CURRENT PHASE
                // =====================================

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


                // =====================================
                // VALIDATE STATE VERSION
                // =====================================

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


                // =====================================
                // STALE STATE PROTECTION
                // =====================================

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


                // =====================================
                // FIND COMPETITION ENTRY
                // =====================================

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


                // =====================================
                // DETERMINE ATHLETE'S NEXT ATTEMPT
                //
                // The LIVE competition phase is
                // authoritative.
                // =====================================

                const currentAttempt =
                    getCurrentAttempt(
                        competitionEntry,
                        currentPhase
                    );


                // =====================================
                // INTEGRITY ERROR FROM RESOLVER
                // =====================================

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


                // =====================================
                // ATHLETE COMPLETED REQUESTED PHASE
                // =====================================

                if (
                    currentAttempt.completed
                ) {

                    throw new Error(
                        `Athlete has no remaining ${currentPhase} attempts.`
                    );

                }


                // =====================================
                // SAFETY CHECK
                // =====================================

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


                // =====================================
                // VALIDATE ATTEMPT NUMBER
                // =====================================

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


                // =====================================
                // SELECT AUTHORITATIVE ATTEMPT ARRAY
                // =====================================

                const attempts =
                    currentPhase === "SNATCH"
                        ? competitionEntry.snatchAttempts
                        : competitionEntry.cleanJerkAttempts;


                // =====================================
                // FIND AUTHORITATIVE ATTEMPT
                // =====================================

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


                // =====================================
                // ATTEMPT MUST STILL BE PENDING
                // =====================================

                if (
                    attempt.result !==
                    "PENDING"
                ) {

                    throw new Error(
                        "This attempt has already been completed."
                    );

                }


                // =====================================
                // DETERMINE WHETHER ATHLETE IS CURRENT
                //
                // Capture this BEFORE changing the
                // declaration.
                //
                // currentEntryId represents the
                // athlete occupying the platform.
                // =====================================

                const editedAthleteIsCurrent =
                    String(
                        liveCompetition.currentEntryId ?? ""
                    ) ===
                    String(
                        entryId
                    );


                // =====================================
                // SAVE / EDIT DECLARATION
                //
                // Completed historical attempts are
                // never modified.
                // =====================================

                attempt.declaredWeight =
                    weight;

                attempt.declaredAt =
                    new Date();


                // =====================================
                // PERSIST ATHLETE STATE
                //
                // The declaration must be visible to
                // the queue calculation inside the
                // same transaction.
                // =====================================

                await competitionEntry.save({

                    session:
                        mongoSession,

                });


                // =====================================
                // CURRENT ATHLETE DECLARATION CHANGE
                //
                // IMPORTANT:
                //
                // A future declaration change can
                // change calling-order priority.
                //
                // If this athlete is currently on the
                // platform, recalculate the queue with
                // the current athlete eligible.
                //
                // recalculateQueue() is READ-ONLY.
                // It does not assign currentEntryId.
                //
                // We assign currentEntryId here because
                // this declaration action is the
                // authoritative state-changing operation.
                // =====================================

                let queueState =
                    null;

                let newCurrentEntryId =
                    liveCompetition.currentEntryId ??
                    null;


                if (
                    editedAthleteIsCurrent
                ) {

                    queueState =
                        await recalculateQueue({

                            competitionId,

                            gender:
                                normalizedGender,

                            dbSession:
                                mongoSession,

                            allowCurrentEntry:
                                true,

                        });


                    const nextAthlete =
                        queueState?.nextAthlete ??
                        null;


                    // ---------------------------------
                    // A valid current athlete declaration
                    // should normally leave at least that
                    // athlete eligible.
                    //
                    // If no athlete is eligible, do not
                    // silently erase the platform state.
                    // This is an integrity condition.
                    // ---------------------------------

                    if (!nextAthlete) {

                        const error =
                            new Error(
                                "No eligible athlete is available after the current athlete declaration change."
                            );

                        error.code =
                            "QUEUE_INTEGRITY_ERROR";

                        error.statusCode =
                            409;

                        throw error;

                    }


                    newCurrentEntryId =
                        nextAthlete.entryId ??
                        null;


                    if (!newCurrentEntryId) {

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


                    // ---------------------------------
                    // Update authoritative platform state
                    // ---------------------------------

                    liveCompetition.currentEntryId =
                        newCurrentEntryId;

                }


                // =====================================
                // ADVANCE STATE VERSION
                //
                // Exactly one state-version increment
                // for this accepted declaration action.
                // =====================================

                liveCompetition.stateVersion =
                    liveCompetition.stateVersion + 1;


                // =====================================
                // PERSIST LIVE STATE
                // =====================================

                await liveCompetition.save({

                    session:
                        mongoSession,

                });


                // =====================================
                // AUTHORITATIVE RESULT
                // =====================================

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

                    editedAthleteIsCurrent,

                    previousCurrentEntryId:
                        editedAthleteIsCurrent
                            ? String(
                                liveCompetition.currentEntryId ??
                                ""
                            )
                            : null,

                    currentEntryId:
                        liveCompetition.currentEntryId ??
                        null,

                    queueState,

                };

            }
        );


        // =====================================
        // LOG
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
            "Edited Athlete Was Current:",
            result.editedAthleteIsCurrent
        );

        console.log(
            "Current Entry After Save:",
            result.currentEntryId
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


        // =====================================
        // RETURN
        // =====================================

        return result;

    } finally {

        await mongoSession.endSession();

    }

};


export default saveDeclaration;