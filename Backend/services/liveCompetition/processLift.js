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
// Flow:
//
// 1. Validate request
// 2. Load authoritative LiveCompetition
// 3. Validate state/version
// 4. Verify athlete is on platform
// 5. Resolve current attempt
// 6. Record GOOD / NO_LIFT
// 7. Assign performedAt
// 8. Assign performedSequence
// 9. Establish next attempt weight
// 10. Recalculate competition results
// 11. CLEAR the occupied platform
// 12. Advance using the recalculated queue
// 13. Increment stateVersion ONCE
// 14. Return authoritative state
//
// IMPORTANT:
//
// After a result:
//
//     previous athlete leaves platform
//
// before the next queue is resolved.
//
// The previous athlete may still become the
// next athlete later if the authoritative
// calling-order rules make that athlete first.
//
// React never selects the next athlete.
//
// =====================================


/**
 * Resolve the applicable weight of an attempt.
 *
 * Attempt 1:
 *   declared weight if present,
 *   otherwise opening weight.
 *
 * Attempt 2/3:
 *   declared weight is required.
 */
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


    // =====================================
    // ATTEMPT 1 OPENING WEIGHT FALLBACK
    // =====================================

    if (
        attempt.attemptNo === 1
    ) {

        const openingWeight =
            phase === "SNATCH"
                ? competitionEntry.opening?.snatch
                : competitionEntry.opening?.cleanJerk;


        const numericOpeningWeight =
            Number(
                openingWeight
            );


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


/**
 * Establish automatic weight for the next
 * pending attempt.
 *
 * GOOD:
 *   current applicable weight + 1 kg
 *
 * NO_LIFT:
 *   same applicable weight
 *
 * Existing valid declaration:
 *   preserve it.
 */
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
// SNATCH → CLEAN & JERK
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
            attempt: nextAttempt,
            weight: existingNextWeight,
            changed: false,
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
        attempt: nextAttempt,
        weight: openingWeight,
        changed: true,
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
    // =====================================
    // NO NEXT ATTEMPT
    // =====================================

    if (!nextAttempt) {

        return null;

    }


    // =====================================
    // NEVER MODIFY COMPLETED ATTEMPT
    // =====================================

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


    // =====================================
    // CALCULATE NEXT WEIGHT
    // =====================================

    const nextWeight =
        result === "GOOD"
            ? currentWeight + 1
            : currentWeight;


    // =====================================
    // WEIGHT SAFETY
    // =====================================

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


    // =====================================
    // SAVE AUTOMATIC NEXT WEIGHT
    // =====================================

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


    // =====================================
    // VALIDATE COMPETITION
    // =====================================

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


    // =====================================
    // VALIDATE ENTRY
    // =====================================

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


    // =====================================
    // VALIDATE GENDER
    // =====================================

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


    // =====================================
    // VALIDATE STATE VERSION
    // =====================================

    if (
        !Number.isInteger(
            expectedStateVersion
        ) ||
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
                // LOAD AUTHORITATIVE LIVE SESSION
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


                // =================================
                // RECOVERY SAFETY
                // =================================

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


                // =================================
                // SESSION MUST BE RUNNING
                // =================================

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
                // VERIFY PLATFORM OCCUPANCY
                // =================================

                if (
                    !liveSession.currentEntryId
                ) {

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
                    liveSession.currentEntryId
                        .toString() !==
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
                //
                // Phase MUST come from the
                // authoritative live session.
                // =================================

                const currentAttempt =
                    getCurrentAttempt(
                        competitionEntry,
                        liveSession.currentPhase
                    );


                // =================================
                // RESOLVER INTEGRITY
                // =================================

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


                // =================================
                // PHASE INTEGRITY
                // =================================

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


                // =================================
                // FIND AUTHORITATIVE ATTEMPT
                // =================================

                const attempts =
                    currentAttempt.phase ===
                        "SNATCH"
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


                // =================================
                // DUPLICATE RESULT PROTECTION
                // =================================

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
                // Persist chronological lift order.
                // =================================

                const allEntries =
                    await CompetitionEntry.find({

                        competitionId,

                    })
                        .session(
                            dbSession
                        )
                        .select(
                            "snatchAttempts cleanJerkAttempts"
                        )
                        .lean();


                const allSequences =
                    allEntries
                        .flatMap(
                            (entry) => [

                                ...(entry.snatchAttempts || [])
                                    .map(
                                        (item) =>
                                            item.performedSequence
                                    ),

                                ...(entry.cleanJerkAttempts || [])
                                    .map(
                                        (item) =>
                                            item.performedSequence
                                    ),

                            ]
                        )
                        .filter(
                            (value) =>
                                Number.isInteger(value)
                        );


                const highestSequence =
                    allSequences.length > 0
                        ? Math.max(
                            ...allSequences
                        )
                        : 0;


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
                // SAVE ATHLETE RESULT
                //
                // Save before queue resolution so
                // the queue sees the authoritative
                // completed attempt + next state.
                // =================================

                await competitionEntry.save({

                    session:
                        dbSession,

                });


                // =================================
                // UPDATE COMPETITION RESULTS
                // =================================

                const updatedEntry =
                    await updateCompetitionResults(
                        competitionEntry,
                        dbSession
                    );


                // =================================
                // CRITICAL PLATFORM TRANSITION
                //
                // The athlete whose lift was just
                // judged has LEFT the platform.
                //
                // This MUST happen before
                // advanceCompetition().
                //
                // The athlete can still be selected
                // again by the queue engine if the
                // verified calling-order rules make
                // that athlete next.
                //
                // But they are no longer the
                // currently occupied platform.
                // =================================

                const previousCurrentEntryId =
                    liveSession.currentEntryId;


                liveSession.currentEntryId =
                    null;

                liveSession.prepareEntryId =
                    null;


                console.log(
                    "===== PLATFORM CLEARED AFTER RESULT ====="
                );

                console.log(
                    "Previous athlete:",
                    previousCurrentEntryId
                        ?.toString() ??
                        "NONE"
                );

                console.log(
                    "Result:",
                    result
                );

                console.log(
                    "Phase:",
                    liveSession.currentPhase
                );


                // =================================
                // SAVE CLEARED PLATFORM STATE
                //
                // Keep the same Mongoose document.
                // Do not create a second session.
                // =================================

                await liveSession.save({

                    session:
                        dbSession,

                });


                // =================================
                // AUTOMATIC ADVANCEMENT
                //
                // advanceCompetition receives the
                // SAME liveSession object.
                //
                // Its post-result queue mode allows
                // the previous athlete to compete
                // again if the normal queue rules
                // make that athlete next.
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
                //
                // One accepted lift = one version
                // increment.
                //
                // advanceCompetition() does NOT
                // increment it.
                // =================================

                const previousStateVersion =
                    currentStateVersion;


                advancedSession.stateVersion =
                    previousStateVersion + 1;


                // =================================
                // PERSIST FINAL AUTHORITATIVE STATE
                // =================================

                await advancedSession.save({

                    session:
                        dbSession,

                });


                // =================================
                // RESOLVE NEW CURRENT ATHLETE
                // =================================

                let nextAttempt =
                    null;


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
                // FINAL DIAGNOSTIC
                // =================================

                console.log(
                    "===================================="
                );

                console.log(
                    "PROCESS LIFT COMPLETE"
                );

                console.log(
                    "Previous Current:",
                    previousCurrentEntryId
                        ?.toString() ??
                        "NONE"
                );

                console.log(
                    "New Current:",
                    advancedSession.currentEntryId
                        ?.toString() ??
                        "NONE"
                );

                console.log(
                    "Phase:",
                    advancedSession.currentPhase
                );

                console.log(
                    "Result:",
                    result
                );

                console.log(
                    "Attempt:",
                    currentAttempt.attemptNo
                );

                console.log(
                    "Next Attempt Weight:",
                    nextAttemptState?.weight ??
                        null
                );

                console.log(
                    "State Version:",
                    advancedSession.stateVersion
                );

                console.log(
                    "===================================="
                );


                // =================================
                // AUTHORITATIVE RESPONSE
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

    currentEntryId:
        advancedSession.currentEntryId ??
        null,

    platformCleared:
        !Boolean(
            advancedSession.currentEntryId
        ),

    manualSelectionRequired:
        false,

    previousStateVersion,

    stateVersion:
        advancedSession.stateVersion,

    // =================================
    // JUST COMPLETED
    //
    // Snapshot of the athlete and attempt
    // that has just been processed.
    //
    // This is created from the authoritative
    // transaction state. It does NOT affect
    // calling-order calculation.
    // =================================

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

        currentEntryId:
            advancedSession.currentEntryId ??
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