import LiveCompetition from "../../models/LiveCompetition.js";

import getEligibleQueueCandidates
    from "./getEligibleQueueCandidates.js";

import {
    orderQueue,
} from "./selectNextAthlete.js";


// =====================================
// FEATURE 3.3
// QUEUE RECALCULATION
//
// Responsibility:
//
// 1. Read authoritative live session.
// 2. Determine eligible candidates using
//    Feature 3.1.
// 3. Order candidates using Feature 3.2.
// 4. Preserve the currently occupied
//    platform during normal recalculation.
// 5. Support explicit post-result
//    recalculation where the athlete who
//    just left the platform may be eligible
//    again for a later attempt.
// 6. Return authoritative queue state.
//
// IMPORTANT:
//
// This service is READ-ONLY.
//
// It does NOT:
// - modify athlete attempts
// - modify results
// - assign currentEntryId
// - increment stateVersion
// - mutate competition state
// - perform phase transitions
//
// =====================================
//
// TRANSACTION SUPPORT
//
// dbSession is optional.
//
// Normal:
//
// recalculateQueue({
//     competitionId,
//     gender,
// })
//
// Transactional:
//
// recalculateQueue({
//     competitionId,
//     gender,
//     dbSession,
// })
//
// =====================================
//
// CURRENT-ENTRY BEHAVIOUR
//
// Normal recalculation:
//
//     allowCurrentEntry = false
//
// The athlete currently occupying the
// platform remains protected.
//
// Post-result advancement:
//
//     allowCurrentEntry = true
//
// The previous platform athlete may therefore
// be considered again for their next attempt.
//
// =====================================


const recalculateQueue = async ({
    competitionId,
    gender,
    dbSession = null,
    allowCurrentEntry = false,
}) => {

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

    let sessionQuery =
        LiveCompetition.findOne({

            competitionId,

            gender:
                normalizedGender,

        });


    if (dbSession) {

        sessionQuery =
            sessionQuery.session(
                dbSession
            );

    }


    const session =
        await sessionQuery;


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
                "Live competition requires recovery. Automatic queue progression is stopped."
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
                "Live competition integrity requires recovery. Automatic queue progression is stopped."
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;

    }


    // =====================================
    // GET ELIGIBLE CANDIDATES
    //
    // Feature 3.1
    // =====================================

    const candidateResult =
        await getEligibleQueueCandidates({

            competitionId,

            gender:
                normalizedGender,

            dbSession,

            allowCurrentEntry,

        });


    // =====================================
    // NORMALIZE CANDIDATES
    // =====================================

    const candidates =
        Array.isArray(
            candidateResult?.candidates
        )
            ? candidateResult.candidates
            : [];


    // =====================================
    // PRESERVE REJECTION INFORMATION
    //
    // IMPORTANT:
    //
    // An empty eligible queue does NOT
    // automatically mean competition
    // completion.
    //
    // For example, athletes may exist but
    // require a declaration before they can
    // enter the calling queue.
    //
    // This information is therefore passed
    // to the transition layer.
    // =====================================

    const rejectedCandidates =
        Array.isArray(
            candidateResult?.rejectedCandidates
        )
            ? candidateResult.rejectedCandidates
            : [];


    // =====================================
    // ORDER CANDIDATES
    //
    // Feature 3.2 owns calling order.
    //
    // No sorting is duplicated here.
    // =====================================

    const orderedCandidates =
        orderQueue(
            candidates,
            session.currentPhase
        );


    // =====================================
    // CURRENT PLATFORM
    // =====================================

    const currentEntryId =
        session.currentEntryId ??
        null;


    // =====================================
    // NEXT ATHLETE
    //
    // READ ONLY.
    //
    // This service does not assign the
    // athlete to the platform.
    // =====================================

    const nextAthlete =
        orderedCandidates[0] ??
        null;


    const upcoming =
        orderedCandidates.slice(1);


    // =====================================
    // DECLARATION-PENDING DETECTION
    //
    // This is diagnostic/state information.
    //
    // It does NOT make undeclared athletes
    // eligible.
    // =====================================

    const declarationPendingCandidates =
        rejectedCandidates.filter(
            (candidate) =>
                candidate.reason ===
                "DECLARATION_REQUIRED"
        );


    const declarationPending =
        declarationPendingCandidates.length >
        0;


    // =====================================
    // RETURN AUTHORITATIVE QUEUE STATE
    // =====================================

    return {

        session,

        currentEntryId,

        nextAthlete,

        upcoming,

        queue:
            orderedCandidates,

        candidateCount:
            orderedCandidates.length,

        platformOccupied:
            Boolean(
                currentEntryId
            ),

        platformPreserved:
            Boolean(
                currentEntryId &&
                !allowCurrentEntry
            ),

        allowCurrentEntry,

        // ---------------------------------
        // Diagnostic / transition metadata
        // ---------------------------------

        rejectedCandidates,

        declarationPending,

        declarationPendingCandidates,

    };

};


export default recalculateQueue;