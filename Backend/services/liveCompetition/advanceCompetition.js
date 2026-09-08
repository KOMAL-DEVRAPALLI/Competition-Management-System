import LiveCompetition from "../../models/LiveCompetition.js";

import recalculateQueue
    from "./recalculateQueue.js";

import transitionCompetitionPhase
    from "./transitionCompetitionPhase.js";


// =====================================
// AUTOMATIC ADVANCEMENT AFTER RESULT
//
// STATE MODEL:
//
// currentEntryId
//     = calling current
//
// platformEntryId
//     = physical platform athlete
//
// After a result both are cleared.
//
// Queue then determines the next athlete.
//
// The selected athlete becomes both:
//
//     currentEntryId
//     platformEntryId
//
// Calling-order calculation remains entirely
// inside recalculateQueue().
// =====================================


const advanceCompetition = async (
    competitionId,
    gender,
    dbSession = null,
    liveSession = null
) => {

    // =====================================
    // VALIDATE INPUT
    // =====================================

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


    if (!session) {

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
    // TERMINAL STATE
    // =====================================

    if (
        session.currentPhase ===
        "COMPLETED"
    ) {

        session.currentEntryId =
            null;

        session.platformEntryId =
            null;


        return {

            session,

            advanced:
                false,

            reason:
                "COMPETITION_COMPLETED",

            currentEntryId:
                null,

            platformEntryId:
                null,

        };

    }


    // =====================================
    // VALID ACTIVE PHASE
    // =====================================

    if (
        session.currentPhase !== "SNATCH" &&
        session.currentPhase !== "CLEAN_JERK"
    ) {

        const error =
            new Error(
                `Invalid live competition phase: ${session.currentPhase}`
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;
    }


    // =====================================
    // REMEMBER PREVIOUS STATE
    // =====================================

    const previousCurrentEntryId =
        session.currentEntryId ??
        null;

    const previousPlatformEntryId =
        session.platformEntryId ??
        session.currentEntryId ??
        null;


    // =====================================
    // RELEASE PLATFORM + CALLING CURRENT
    //
    // The result has already been processed.
    //
    // The queue must now resolve the next
    // authoritative athlete from a clean
    // state.
    // =====================================

    session.currentEntryId =
        null;

    session.platformEntryId =
        null;


    // =====================================
    // PHASE TRANSITION
    // =====================================

    const transitionResult =
        await transitionCompetitionPhase({

            competitionId,

            gender:
                normalizedGender,

            dbSession,

            liveSession:
                session,

            incrementStateVersion:
                false,

        });


    session =
        transitionResult?.session ??
        transitionResult ??
        session;


    if (!session) {

        const error =
            new Error(
                "Phase transition did not return an authoritative live competition session."
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;
    }


    const phaseTransitioned =
        Boolean(
            transitionResult?.transitioned
        );


    // =====================================
    // COMPETITION COMPLETED
    // =====================================

    if (
        session.currentPhase ===
        "COMPLETED"
    ) {

        session.currentEntryId =
            null;

        session.platformEntryId =
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
                phaseTransitioned
                    ? "COMPETITION_COMPLETED_AFTER_PHASE_TRANSITION"
                    : "COMPETITION_COMPLETED",

            currentEntryId:
                null,

            platformEntryId:
                null,

            previousCurrentEntryId,

            previousPlatformEntryId,

            phaseTransitioned,

            queue:
                [],

            upcoming:
                [],

            candidateCount:
                0,

        };

    }


    // =====================================
    // VALIDATE ACTIVE PHASE
    // =====================================

    if (
        session.currentPhase !== "SNATCH" &&
        session.currentPhase !== "CLEAN_JERK"
    ) {

        const error =
            new Error(
                `Invalid active phase after transition: ${session.currentPhase}`
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;
    }


    // =====================================
    // RECALCULATE AUTHORITATIVE QUEUE
    //
    // Queue engine owns calling order.
    // =====================================

    const queueState =
        await recalculateQueue({

            competitionId,

            gender:
                normalizedGender,

            dbSession,

            allowCurrentEntry:
                false,
            liveSession:
    session,
        });


    // =====================================
    // DECLARATION PENDING
    // =====================================

    if (
        !queueState?.nextAthlete &&
        queueState?.declarationPending
    ) {

        session.currentEntryId =
            null;

        session.platformEntryId =
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

            platformEntryId:
                null,

            previousCurrentEntryId,

            previousPlatformEntryId,

            declarationPending:
                true,

            declarationPendingCandidates:
                queueState
                    .declarationPendingCandidates ??
                [],

            phaseTransitioned,

            queue:
                queueState.queue ??
                [],

            upcoming:
                queueState.upcoming ??
                [],

            candidateCount:
                queueState.candidateCount ??
                0,

        };

    }


    // =====================================
    // RESOLVE NEXT ATHLETE
    // =====================================

    const nextAthlete =
        queueState?.nextAthlete ??
        null;


    // =====================================
    // NO ELIGIBLE ATHLETE
    // =====================================

    if (!nextAthlete) {

        session.currentEntryId =
            null;

        session.platformEntryId =
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

            platformEntryId:
                null,

            previousCurrentEntryId,

            previousPlatformEntryId,

            phaseTransitioned,

            queue:
                queueState.queue ??
                [],

            upcoming:
                queueState.upcoming ??
                [],

            candidateCount:
                queueState.candidateCount ??
                0,

            declarationPending:
                Boolean(
                    queueState.declarationPending
                ),

            declarationPendingCandidates:
                queueState
                    .declarationPendingCandidates ??
                [],

        };

    }


    // =====================================
    // ENTRY ID VALIDATION
    // =====================================

    if (!nextAthlete.entryId) {

        const error =
            new Error(
                "Queue returned an athlete without an entry ID."
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;
    }


    // =====================================
    // ASSIGN NEW ATHLETE
    //
    // The queue has determined the
    // authoritative next athlete.
    //
    // That athlete becomes both:
    //
    //     calling current
    //     physical platform athlete
    // =====================================

    session.currentEntryId =
        nextAthlete.entryId;

    session.platformEntryId =
        nextAthlete.entryId;


    // =====================================
    // PERSIST
    //
    // processLift owns stateVersion.
    // =====================================

    await session.save({
        session:
            dbSession ??
            undefined,
    });


    // =====================================
    // RETURN AUTHORITATIVE RESULT
    // =====================================

    return {

        session,

        advanced:
            true,

        reason:
            phaseTransitioned
                ? "PHASE_TRANSITION_ATHLETE_ASSIGNED"
                : "ATHLETE_ASSIGNED",

        currentEntryId:
            session.currentEntryId,

        platformEntryId:
            session.platformEntryId,

        previousCurrentEntryId,

        previousPlatformEntryId,

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

        phase:
            session.currentPhase,

        phaseTransitioned,

        queue:
            queueState.queue ??
            [],

        upcoming:
            queueState.upcoming ??
            [],

        candidateCount:
            queueState.candidateCount ??
            0,

        declarationPending:
            Boolean(
                queueState.declarationPending
            ),

        declarationPendingCandidates:
            queueState
                .declarationPendingCandidates ??
            [],

        stateVersion:
            session.stateVersion,

    };

};


export default advanceCompetition;