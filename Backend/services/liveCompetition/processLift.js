import mongoose from "mongoose";

import CompetitionEntry
    from "../../models/CompetitionEntry.js";

import LiveCompetition
    from "../../models/LiveCompetition.js";

import updateCompetitionResults
    from "../calculations/updateCompetitionResults.js";

import getCurrentAttempt
    from "./getCurrentAttempt.js";

import advanceCompetition
    from "./advanceCompetition.js";


// =====================================
// PROCESS LIFT
//
// AUTHORITATIVE STATE TRANSITION
//
// currentEntryId
//     = calling current
//
// platformEntryId
//     = physical platform/result athlete
//
// IMPORTANT:
//
// These may temporarily differ.
//
// Example:
//
//     currentEntryId  = B
//     platformEntryId = C
//
// Good/No Lift must process C.
// =====================================


const getApplicableAttemptWeight = (
    competitionEntry,
    phase,
    attempt
) => {

    if (!attempt) {
        return null;
    }


    const declaredWeight =
        Number(
            attempt.declaredWeight
        );


    if (
        Number.isFinite(declaredWeight) &&
        declaredWeight > 0
    ) {
        return declaredWeight;
    }


    if (
        attempt.attemptNo === 1
    ) {

        const openingWeight =
            phase === "SNATCH"
                ? competitionEntry.opening?.snatch
                : competitionEntry.opening?.cleanJerk;


        const numericOpeningWeight =
            Number(openingWeight);


        if (
            Number.isFinite(
                numericOpeningWeight
            ) &&
            numericOpeningWeight > 0
        ) {
            return numericOpeningWeight;
        }
    }


    return null;

};


// =====================================
// ESTABLISH NEXT ATTEMPT STATE
// =====================================

const establishNextAttemptWeight = ({
    competitionEntry,
    currentAttempt,
    result,
}) => {

    if (!currentAttempt) {

        throw new Error(
            "Current attempt is required to establish the next attempt."
        );
    }


    const phase =
        currentAttempt.phase;


    const attempts =
        phase === "SNATCH"
            ? competitionEntry.snatchAttempts
            : competitionEntry.cleanJerkAttempts;


    // =====================================
    // SNATCH -> CLEAN & JERK
    // =====================================

    if (
        phase === "SNATCH" &&
        currentAttempt.attemptNo === 3
    ) {

        if (result !== "GOOD") {
            return null;
        }


        const nextAttempt =
            competitionEntry.cleanJerkAttempts?.find(
                (item) =>
                    item.attemptNo === 1
            );


        if (!nextAttempt) {
            return null;
        }


        if (
            nextAttempt.result &&
            nextAttempt.result !== "PENDING"
        ) {
            return null;
        }


        const existingNextWeight =
            Number(
                nextAttempt.declaredWeight
            );


        if (
            Number.isFinite(existingNextWeight) &&
            existingNextWeight > 0
        ) {

            return {

                attempt:
                    nextAttempt,

                weight:
                    existingNextWeight,

                changed:
                    false,

            };
        }


        const openingWeight =
            Number(
                competitionEntry.opening?.cleanJerk
            );


        if (
            !Number.isFinite(openingWeight) ||
            openingWeight <= 0
        ) {

            const error =
                new Error(
                    "Unable to determine Clean & Jerk opening weight."
                );

            error.code =
                "QUEUE_INTEGRITY_ERROR";

            error.statusCode =
                409;

            throw error;
        }


        nextAttempt.declaredWeight =
            openingWeight;


        return {

            attempt:
                nextAttempt,

            weight:
                openingWeight,

            changed:
                true,

        };

    }


    // =====================================
    // FIND NEXT ATTEMPT
    // =====================================

    const nextAttempt =
        attempts.find(
            (item) =>
                item.attemptNo ===
                currentAttempt.attemptNo + 1
        );


    if (!nextAttempt) {
        return null;
    }


    if (
        nextAttempt.result &&
        nextAttempt.result !== "PENDING"
    ) {
        return null;
    }


    // =====================================
    // PRESERVE EXISTING DECLARATION
    // =====================================

    const existingNextWeight =
        Number(
            nextAttempt.declaredWeight
        );


    if (
        Number.isFinite(existingNextWeight) &&
        existingNextWeight > 0
    ) {

        return {

            attempt:
                nextAttempt,

            weight:
                existingNextWeight,

            changed:
                false,

        };

    }


    // =====================================
    // RESOLVE CURRENT WEIGHT
    // =====================================

    const currentWeight =
        getApplicableAttemptWeight(
            competitionEntry,
            phase,
            currentAttempt
        );


    if (
        !Number.isFinite(currentWeight) ||
        currentWeight <= 0
    ) {

        const error =
            new Error(
                "Unable to determine the current applicable weight. Automatic progression stopped."
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;
    }


    const nextWeight =
        result === "GOOD"
            ? currentWeight + 1
            : currentWeight;


    if (
        !Number.isInteger(nextWeight) ||
        nextWeight <= 0
    ) {

        const error =
            new Error(
                `Calculated next attempt weight is invalid: ${nextWeight}.`
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;
    }


    nextAttempt.declaredWeight =
        nextWeight;


    return {

        attempt:
            nextAttempt,

        weight:
            nextWeight,

        changed:
            true,

    };

};


// =====================================
// GET HIGHEST PERFORMED SEQUENCE
//
// PERFORMANCE OPTIMIZATION
//
// Previous implementation loaded every
// CompetitionEntry and every attempt into
// Node.js, then calculated Math.max().
//
// This aggregation asks MongoDB only for
// the highest existing performedSequence.
//
// No competition rule is changed.
// =====================================

const getHighestPerformedSequence = async (
    competitionId,
    dbSession
) => {

    const entries =
        await CompetitionEntry.find({
            competitionId,
        })
            .select(
                "snatchAttempts cleanJerkAttempts"
            )
            .session(
                dbSession
            )
            .lean();


    let highestSequence = 0;


    for (
        const entry
        of entries
    ) {

        const allAttempts = [
            ...(Array.isArray(entry.snatchAttempts)
                ? entry.snatchAttempts
                : []),

            ...(Array.isArray(entry.cleanJerkAttempts)
                ? entry.cleanJerkAttempts
                : []),
        ];


        for (
            const attempt
            of allAttempts
        ) {

            const sequence =
                Number(
                    attempt?.performedSequence
                );


            if (
                Number.isInteger(sequence) &&
                sequence > highestSequence
            ) {

                highestSequence =
                    sequence;

            }

        }

    }


    return highestSequence;

};


// =====================================
// MAIN SERVICE
// =====================================

const processLift = async ({
    entryId,
    competitionId,
    gender,
    result,
    expectedStateVersion,
}) => {

    // =====================================
    // VALIDATE RESULT
    // =====================================

    if (
        result !== "GOOD" &&
        result !== "NO_LIFT"
    ) {

        const error =
            new Error(
                "Invalid lift result."
            );

        error.code =
            "INVALID_LIFT_RESULT";

        error.statusCode =
            400;

        throw error;
    }


    if (!competitionId) {

        const error =
            new Error(
                "Competition ID is required."
            );

        error.code =
            "INVALID_COMPETITION_ID";

        error.statusCode =
            400;

        throw error;
    }


    if (!entryId) {

        const error =
            new Error(
                "Entry ID is required."
            );

        error.code =
            "INVALID_ENTRY_ID";

        error.statusCode =
            400;

        throw error;
    }


    if (!gender) {

        const error =
            new Error(
                "Gender is required."
            );

        error.code =
            "INVALID_GENDER";

        error.statusCode =
            400;

        throw error;
    }


    const normalizedGender =
        String(gender)
            .trim()
            .toLowerCase();


    if (
        !Number.isInteger(expectedStateVersion) ||
        expectedStateVersion < 0
    ) {

        const error =
            new Error(
                "expectedStateVersion must be a non-negative integer."
            );

        error.code =
            "INVALID_STATE_VERSION";

        error.statusCode =
            400;

        throw error;
    }


    // =====================================
    // START TRANSACTION
    // =====================================

    const dbSession =
        await mongoose.startSession();


    try {

        let response = null;


        await dbSession.withTransaction(
            async () => {

                // =================================
                // LOAD LIVE SESSION
                // =================================

                const liveSession =
                    await LiveCompetition.findOne({

                        competitionId,

                        gender:
                            normalizedGender,

                    }).session(
                        dbSession
                    );


                if (!liveSession) {

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


                if (
                    liveSession.status ===
                    "RECOVERY_REQUIRED"
                ) {

                    const error =
                        new Error(
                            "Live competition requires recovery."
                        );

                    error.code =
                        "RECOVERY_REQUIRED";

                    error.statusCode =
                        409;

                    throw error;
                }


                if (
                    liveSession.integrity?.status ===
                    "RECOVERY_REQUIRED"
                ) {

                    const error =
                        new Error(
                            "Live competition integrity requires recovery."
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;
                }


                if (
                    liveSession.status !==
                    "RUNNING"
                ) {

                    const error =
                        new Error(
                            "Live competition is not currently running."
                        );

                    error.code =
                        "LIVE_COMPETITION_NOT_RUNNING";

                    error.statusCode =
                        409;

                    throw error;
                }


                // =================================
                // STALE STATE PROTECTION
                // =================================

                const currentStateVersion =
                    liveSession.stateVersion;

                const previousStateVersion =
                    currentStateVersion;


                if (
                    currentStateVersion !==
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
                        currentStateVersion;

                    throw error;
                }


                // =================================
                // RESOLVE PHYSICAL PLATFORM ATHLETE
                // =================================

                const platformEntryId =
                    liveSession.platformEntryId ??
                    liveSession.currentEntryId ??
                    null;


                if (!platformEntryId) {

                    const error =
                        new Error(
                            "No athlete is currently on the platform."
                        );

                    error.code =
                        "NO_CURRENT_ATHLETE";

                    error.statusCode =
                        409;

                    throw error;
                }


                // =================================
                // VERIFY REQUESTED ATHLETE
                // =================================

                if (
                    platformEntryId.toString() !==
                    entryId.toString()
                ) {

                    const error =
                        new Error(
                            "This athlete is not currently on the platform."
                        );

                    error.code =
                        "ATHLETE_NOT_ON_PLATFORM";

                    error.statusCode =
                        409;

                    throw error;
                }


                // =================================
                // ENSURE PLATFORM FIELD EXISTS
                // =================================

                if (
                    !liveSession.platformEntryId
                ) {

                    liveSession.platformEntryId =
                        platformEntryId;

                }


                // =================================
                // LOAD COMPETITION ENTRY
                // =================================

                const competitionEntry =
                    await CompetitionEntry.findById(
                        entryId
                    ).session(
                        dbSession
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
                // RESOLVE CURRENT ATTEMPT
                // =================================

                const currentAttempt =
                    getCurrentAttempt(
                        competitionEntry,
                        liveSession.currentPhase
                    );


                if (
                    currentAttempt?.integrityError
                ) {

                    const error =
                        new Error(
                            `Athlete attempt history integrity failed: ${currentAttempt.integrityError}`
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

                    const error =
                        new Error(
                            "Unable to determine a pending attempt for the athlete."
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;
                }


                if (
                    currentAttempt.phase !==
                    liveSession.currentPhase
                ) {

                    const error =
                        new Error(
                            `Athlete attempt is ${currentAttempt.phase}, but live competition is in ${liveSession.currentPhase}.`
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;
                }


                const attempts =
                    currentAttempt.phase === "SNATCH"
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
                            "Authoritative attempt not found."
                        );

                    error.code =
                        "QUEUE_INTEGRITY_ERROR";

                    error.statusCode =
                        409;

                    throw error;
                }


                if (
                    attempt.result !==
                    "PENDING"
                ) {

                    const error =
                        new Error(
                            "This attempt has already been judged."
                        );

                    error.code =
                        "DUPLICATE_LIFT_RESULT";

                    error.statusCode =
                        409;

                    throw error;
                }


                // =================================
                // RECORD RESULT
                // =================================

                const performedAt =
                    new Date();


                attempt.result =
                    result;

                attempt.performedAt =
                    performedAt;


                // =================================
                // PERFORMED SEQUENCE
                //
                // PERFORMANCE OPTIMIZATION:
                //
                // MongoDB calculates the highest
                // existing sequence instead of
                // loading all competition entries
                // and all attempts into Node.js.
                // =================================

                const highestSequence =
                    await getHighestPerformedSequence(
                        competitionId,
                        dbSession
                    );


                attempt.performedSequence =
                    highestSequence + 1;


                // =================================
                // ESTABLISH NEXT ATTEMPT STATE
                // =================================

                const nextAttemptState =
                    establishNextAttemptWeight({

                        competitionEntry,

                        currentAttempt,

                        result,

                    });


                // =================================
                // SAVE RESULT
                // =================================

                await competitionEntry.save({
                    session:
                        dbSession,
                });


                // =================================
                // UPDATE RESULTS
                // =================================

                const updatedEntry =
                    await updateCompetitionResults(
                        competitionEntry,
                        dbSession
                    );


                // =================================
                // CLEAR BOTH CALLING + PLATFORM
                //
                // IMPORTANT:
                //
                // Do NOT save here.
                //
                // advanceCompetition() receives the
                // same Mongoose document and the final
                // save below persists the complete
                // authoritative state.
                // =================================

                const previousCurrentEntryId =
                    liveSession.currentEntryId ??
                    null;

                const previousPlatformEntryId =
                    liveSession.platformEntryId ??
                    platformEntryId;


                liveSession.currentEntryId =
                    null;

                liveSession.platformEntryId =
                    null;


                // =================================
                // AUTOMATIC ADVANCEMENT
                // =================================

                const advanceResult =
                    await advanceCompetition(

                        competitionId,

                        normalizedGender,

                        dbSession,

                        liveSession

                    );


                const advancedSession =
                    advanceResult?.session ??
                    advanceResult;


                if (!advancedSession) {

                    const error =
                        new Error(
                            "Automatic advancement did not return a valid LiveCompetition session."
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

                advancedSession.stateVersion =
                    currentStateVersion + 1;


                // =================================
                // PERSIST FINAL STATE
                // =================================

                await advancedSession.save({
                    session:
                        dbSession,
                });


                // =================================
                // RESOLVE NEW CURRENT ATTEMPT
                // =================================

                let nextAttempt = null;


                if (
                    advancedSession.currentEntryId
                ) {

                    const nextEntry =
                        await CompetitionEntry.findById(
                            advancedSession.currentEntryId
                        )
                            .session(
                                dbSession
                            );


                    if (!nextEntry) {

                        const error =
                            new Error(
                                "New current athlete could not be found."
                            );

                        error.code =
                            "QUEUE_INTEGRITY_ERROR";

                        error.statusCode =
                            409;

                        throw error;
                    }


                    nextAttempt =
                        getCurrentAttempt(
                            nextEntry,
                            advancedSession.currentPhase
                        );


                    if (
                        nextAttempt?.integrityError
                    ) {

                        const error =
                            new Error(
                                `New current athlete has invalid attempt state: ${nextAttempt.integrityError}`
                            );

                        error.code =
                            "QUEUE_INTEGRITY_ERROR";

                        error.statusCode =
                            409;

                        throw error;
                    }

                }


                // =================================
                // RESPONSE
                // =================================

                response = {

                    athlete:
                        updatedEntry,

                    session:
                        advancedSession,

                    result,

                    performedAt,

                    performedSequence:
                        attempt.performedSequence,

                    nextAttempt,

                    nextAttemptState,

                    previousCurrentEntryId,

                    previousPlatformEntryId,

                    currentEntryId:
                        advancedSession.currentEntryId ??
                        null,

                    platformEntryId:
                        advancedSession.platformEntryId ??
                        null,

                    platformCleared:
                        !Boolean(
                            advancedSession.platformEntryId
                        ),

                    manualSelectionRequired:
                        false,

                    previousStateVersion,

                    stateVersion:
                        advancedSession.stateVersion,

                    justCompleted: {

                        athlete:
                            updatedEntry,

                        completedAttempt: {

                            phase:
                                currentAttempt.phase,

                            attemptNo:
                                currentAttempt.attemptNo,

                            declaredWeight:
                                currentAttempt.declaredWeight,

                            applicableWeight:
                                currentAttempt.applicableWeight,

                            result,

                            completed:
                                true,

                        },

                        nextAttempt,

                        nextAttemptState,

                        previousCurrentEntryId,

                        previousPlatformEntryId,

                        currentEntryId:
                            advancedSession.currentEntryId ??
                            null,

                        platformEntryId:
                            advancedSession.platformEntryId ??
                            null,

                        performedAt,

                        performedSequence:
                            attempt.performedSequence,

                        stateVersion:
                            advancedSession.stateVersion,

                    },

                };

            }
        );


        return response;

    } finally {

        await dbSession.endSession();

    }

};


export default processLift;