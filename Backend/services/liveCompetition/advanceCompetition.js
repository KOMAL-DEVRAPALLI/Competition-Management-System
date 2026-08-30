import LiveCompetition from "../../models/LiveCompetition.js";

import recalculateQueue
    from "./recalculateQueue.js";

import transitionCompetitionPhase
    from "./transitionCompetitionPhase.js";


// =====================================
// FEATURE 3.5
// AUTOMATIC ADVANCEMENT AFTER RESULT
//
// Responsibility:
//
// 1. Use authoritative LiveCompetition
//    state.
// 2. Validate recovery/integrity state.
// 3. Release the athlete who just completed
//    the platform turn.
// 4. Recalculate the authoritative queue.
// 5. Select the first eligible athlete.
// 6. Assign that athlete to the platform.
// 7. Clear stale prepare state.
// 8. Detect exhausted phase and invoke
//    the dedicated phase-transition service.
// 9. After a successful phase transition,
//    resolve the NEW phase queue and assign
//    its first athlete automatically.
//
// IMPORTANT:
//
// session.currentEntryId represents the
// athlete currently occupying the platform.
//
// Once a result has been accepted for that
// athlete, that platform occupation has ended.
//
// Therefore:
//
// previousCurrentEntryId
//     = audit/reference information
//
// session.currentEntryId
//     = current platform occupation
//
// The previous platform athlete MUST NOT
// remain in currentEntryId while the
// post-result queue is being resolved.
//
// =====================================
//
// NOT responsible for:
//
// - calling-order rules
// - eligibility rules
// - result processing
// - phase-transition rules
// - stateVersion increment
//
// =====================================
//
// TRANSACTION SUPPORT:
//
// advanceCompetition(
//     competitionId,
//     gender
// )
//
// advanceCompetition(
//     competitionId,
//     gender,
//     dbSession,
//     liveSession
// )
//
// =====================================
//
// STATE VERSION:
//
// processLift() owns stateVersion.
//
// This service NEVER increments it.
// =====================================


const advanceCompetition = async (
    competitionId,
    gender,
    dbSession = null,
    liveSession = null
) => {

    // =====================================
    // VALIDATE COMPETITION ID
    // =====================================

    if (!competitionId) {

        throw new Error(
            "Competition ID is required."
        );

    }


    // =====================================
    // VALIDATE GENDER
    // =====================================

    if (!gender) {

        throw new Error(
            "Gender is required."
        );

    }


    const normalizedGender =
        String(gender)
            .trim()
            .toLowerCase();


    // =====================================
    // LOAD AUTHORITATIVE SESSION
    // =====================================

    let session =
        liveSession;


    if (!session) {

        let query =
            LiveCompetition.findOne({

                competitionId,

                gender:
                    normalizedGender,

            });


        if (dbSession) {

            query =
                query.session(
                    dbSession
                );

        }


        session =
            await query;

    }


    // =====================================
    // SESSION MUST EXIST
    // =====================================

    if (!session) {

        throw new Error(
            "Live competition session not found."
        );

    }


    // =====================================
    // RECOVERY SAFETY
    // =====================================

    if (
        session.status ===
        "RECOVERY_REQUIRED"
    ) {

        const error =
            new Error(
                "Live competition requires recovery. Automatic advancement is stopped."
            );

        error.code =
            "RECOVERY_REQUIRED";

        error.statusCode =
            409;

        throw error;

    }


    if (
        session.integrity?.status ===
        "RECOVERY_REQUIRED"
    ) {

        const error =
            new Error(
                "Live competition integrity requires recovery. Automatic advancement is stopped."
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;

    }


    // =====================================
    // TERMINAL PHASE
    // =====================================

    if (
        session.currentPhase ===
        "COMPLETED"
    ) {

        return {

            session,

            advanced:
                false,

            reason:
                "COMPETITION_COMPLETED",

            currentEntryId:
                session.currentEntryId ??
                null,

        };

    }


    // =====================================
    // BREAK
    //
    // Dedicated phase-transition logic
    // owns BREAK.
    // =====================================

    if (
        session.currentPhase ===
        "BREAK"
    ) {

        return {

            session,

            advanced:
                false,

            reason:
                "BREAK_PHASE",

            currentEntryId:
                session.currentEntryId ??
                null,

        };

    }


    // =====================================
    // PREVIOUS PLATFORM ATHLETE
    //
    // Preserve this only as a reference.
    //
    // It must NOT remain the current
    // platform occupant while the
    // post-result queue is resolved.
    // =====================================

    const previousCurrentEntryId =
        session.currentEntryId ??
        null;


    // =====================================
    // DIAGNOSTIC
    // =====================================

    console.log(
        "===================================="
    );

    console.log(
        "FEATURE 3.5 - AUTOMATIC ADVANCEMENT"
    );

    console.log(
        "Competition:",
        competitionId.toString()
    );

    console.log(
        "Gender:",
        normalizedGender
    );

    console.log(
        "Phase:",
        session.currentPhase
    );

    console.log(
        "Previous Current:",
        previousCurrentEntryId
            ?.toString() ??
        "NONE"
    );

    console.log(
        "State Version:",
        session.stateVersion
    );


    // =====================================
    // RELEASE PREVIOUS PLATFORM
    //
    // CRITICAL
    //
    // The previous athlete has already
    // completed the result action.
    //
    // currentEntryId therefore represents
    // stale platform occupancy and must be
    // cleared before resolving the next
    // athlete.
    //
    // This allows the authoritative queue
    // to determine who is actually next.
    // =====================================

    session.currentEntryId =
        null;


    // =====================================
    // AUTHORITATIVE CURRENT-PHASE QUEUE
    //
    // The previous athlete may be selected
    // again if another pending attempt
    // exists and the calling-order rules
    // place that athlete first.
    //
    // Completed athletes are excluded by
    // the eligibility layer.
    // =====================================

    const queueState =
        await recalculateQueue({

            competitionId,

            gender:
                normalizedGender,

            dbSession,

            allowCurrentEntry:
                true,

        });


    const nextAthlete =
        queueState?.nextAthlete ??
        null;


    // =====================================
    // DECLARATION-PENDING STATE
    //
    // An empty queue with declaration
    // pending is NOT automatically treated
    // as phase completion.
    // =====================================

    if (
        !nextAthlete &&
        queueState?.declarationPending
    ) {

        session.prepareEntryId =
            null;


        await session.save({

            session:
                dbSession ??
                undefined,

        });


        return {

            session,

            advanced:
                false,

            reason:
                "DECLARATION_PENDING",

            currentEntryId:
                null,

            previousCurrentEntryId,

            declarationPending:
                true,

            declarationPendingCandidates:
                queueState
                    .declarationPendingCandidates ??
                [],

        };

    }


    // =====================================
    // NO ELIGIBLE ATHLETE
    //
    // The active phase is exhausted.
    //
    // Delegate the actual phase transition
    // to transitionCompetitionPhase().
    // =====================================

    if (
        !nextAthlete
    ) {

        console.log(
            "===== NO ELIGIBLE ATHLETE ====="
        );

        console.log({

            phase:
                session.currentPhase,

            previousCurrentEntryId:
                previousCurrentEntryId
                    ?.toString() ??
                null,

        });


        const transitionResult =
            await transitionCompetitionPhase({

                competitionId,

                gender:
                    normalizedGender,

                dbSession,

                liveSession:
                    session,

            });


        // ---------------------------------
        // Refresh local session reference
        // ---------------------------------

        session =
            transitionResult?.session ??
            session;


        // ---------------------------------
        // Competition completed
        // ---------------------------------

        if (
            transitionResult?.reason ===
            "COMPETITION_COMPLETED"
        ) {

            session.currentEntryId =
                null;

            session.prepareEntryId =
                null;


            await session.save({

                session:
                    dbSession ??
                    undefined,

            });


            return {

                session,

                advanced:
                    false,

                reason:
                    "COMPETITION_COMPLETED",

                currentEntryId:
                    null,

                previousCurrentEntryId,

            };

        }


        // ---------------------------------
        // Break / transition state
        // ---------------------------------

        if (
            session.currentPhase ===
            "BREAK"
        ) {

            session.currentEntryId =
                null;

            session.prepareEntryId =
                null;


            await session.save({

                session:
                    dbSession ??
                    undefined,

            });


            return {

                session,

                advanced:
                    false,

                reason:
                    "BREAK_PHASE",

                currentEntryId:
                    null,

                previousCurrentEntryId,

            };

        }


        // ---------------------------------
        // Resolve first athlete of the
        // newly active phase.
        // ---------------------------------

        const nextPhaseQueue =
            await recalculateQueue({

                competitionId,

                gender:
                    normalizedGender,

                dbSession,

                allowCurrentEntry:
                    true,

            });


        const nextPhaseAthlete =
            nextPhaseQueue?.nextAthlete ??
            null;


        if (
            !nextPhaseAthlete
        ) {

            session.currentEntryId =
                null;

            session.prepareEntryId =
                null;


            await session.save({

                session:
                    dbSession ??
                    undefined,

            });


            return {

                session,

                advanced:
                    false,

                reason:
                    "NO_ELIGIBLE_ATHLETE",

                currentEntryId:
                    null,

                previousCurrentEntryId,

            };

        }


        // =================================
        // ASSIGN FIRST ATHLETE OF NEW PHASE
        // =================================

        session.currentEntryId =
            nextPhaseAthlete.entryId;


        session.prepareEntryId =
            null;


        await session.save({

            session:
                dbSession ??
                undefined,

        });


        console.log(
            "===== PHASE TRANSITION ADVANCEMENT ====="
        );

        console.log({

            from:
                previousCurrentEntryId
                    ?.toString() ??
                null,

            to:
                nextPhaseAthlete
                    .entryId
                    ?.toString() ??
                null,

            athlete:
                nextPhaseAthlete.name ??
                null,

            phase:
                nextPhaseAthlete.phase ??
                session.currentPhase,

            attemptNo:
                nextPhaseAthlete.attemptNo ??
                null,

            declaredWeight:
                nextPhaseAthlete.declaredWeight ??
                null,

            applicableWeight:
                nextPhaseAthlete.applicableWeight ??
                null,

        });


        return {

            session,

            advanced:
                true,

            reason:
                "PHASE_TRANSITION_ATHLETE_ASSIGNED",

            currentEntryId:
                session.currentEntryId,

            previousCurrentEntryId,

            athlete:
                nextPhaseAthlete,

            assignment: {

                entryId:
                    nextPhaseAthlete.entryId,

                name:
                    nextPhaseAthlete.name,

                lotNumber:
                    nextPhaseAthlete.lotNumber,

                phase:
                    nextPhaseAthlete.phase,

                attemptNo:
                    nextPhaseAthlete.attemptNo,

                declaredWeight:
                    nextPhaseAthlete.declaredWeight,

                applicableWeight:
                    nextPhaseAthlete.applicableWeight,

            },

            stateVersion:
                session.stateVersion,

        };

    }


    // =====================================
    // DIAGNOSTIC
    // =====================================

    console.log(
        "===== ADVANCEMENT DECISION ====="
    );

    console.log({

        from:
            previousCurrentEntryId
                ?.toString() ??
            null,

        to:
            nextAthlete
                ?.entryId
                ?.toString() ??
            null,

        athlete:
            nextAthlete
                ?.name ??
            null,

        phase:
            nextAthlete
                ?.phase ??
            session.currentPhase,

        attemptNo:
            nextAthlete
                ?.attemptNo ??
            null,

        declaredWeight:
            nextAthlete
                ?.declaredWeight ??
            null,

        applicableWeight:
            nextAthlete
                ?.applicableWeight ??
            null,

    });


    // =====================================
    // ASSIGN CURRENT ATHLETE
    // =====================================

    session.currentEntryId =
        nextAthlete.entryId;


    // =====================================
    // CLEAR PREPARE STATE
    // =====================================

    session.prepareEntryId =
        null;


    // =====================================
    // STATE VERSION
    //
    // processLift() owns stateVersion.
    //
    // No increment here.
    // =====================================


    // =====================================
    // PERSIST AUTHORITATIVE SESSION
    // =====================================

    await session.save({

        session:
            dbSession ??
            undefined,

    });


    // =====================================
    // FINAL DIAGNOSTICS
    // =====================================

    console.log(
        "===== AUTOMATIC ADVANCEMENT COMPLETE ====="
    );

    console.log(
        "Previous Current:",
        previousCurrentEntryId
            ?.toString() ??
        "NONE"
    );

    console.log(
        "Current Entry:",
        session.currentEntryId
            ?.toString() ??
        "NONE"
    );

    console.log(
        "Prepare Entry:",
        session.prepareEntryId
            ?.toString() ??
        "NONE"
    );

    console.log(
        "State Version:",
        session.stateVersion
    );


    // =====================================
    // RETURN
    // =====================================

    return {

        session,

        advanced:
            true,

        reason:
            "ATHLETE_ASSIGNED",

        currentEntryId:
            session.currentEntryId,

        previousCurrentEntryId,

        athlete:
            nextAthlete,

        assignment: {

            entryId:
                nextAthlete.entryId,

            name:
                nextAthlete.name,

            lotNumber:
                nextAthlete.lotNumber,

            phase:
                nextAthlete.phase,

            attemptNo:
                nextAthlete.attemptNo,

            declaredWeight:
                nextAthlete.declaredWeight,

            applicableWeight:
                nextAthlete.applicableWeight,

        },

        stateVersion:
            session.stateVersion,

    };

};


export default advanceCompetition;