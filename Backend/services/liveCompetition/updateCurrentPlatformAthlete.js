import LiveCompetition from "../../models/LiveCompetition.js";

import recalculateQueue
    from "./recalculateQueue.js";


// =====================================
// FEATURE 3.5
// AUTOMATIC PLATFORM ASSIGNMENT
//
// Responsibility:
//
// 1. Read authoritative LiveCompetition
//    state.
// 2. Resolve the authoritative queue.
// 3. Preserve an occupied platform.
// 4. Assign the first eligible queue athlete
//    when the platform is empty.
// 5. Persist CompetitionEntry._id as
//    currentEntryId.
// 6. Increment stateVersion.
//
// IMPORTANT:
//
// Feature 3.5 does NOT determine:
//
// - eligibility
// - calling order
// - attempt ordering
// - weight ordering
// - previous-attempt sequence
//
// Those responsibilities belong to:
//
// Feature 3.1 → eligibility
// Feature 3.2 → ordering
// Feature 3.3 → queue resolution
//
// =====================================
//
// ENTRY ID CONTRACT
//
// The queue candidate contains:
//
//     nextAthlete.entryId
//
// This is the authoritative
// CompetitionEntry._id.
//
// LiveCompetition.currentEntryId also
// references CompetitionEntry.
//
// Therefore:
//
//     currentEntryId = nextAthlete.entryId
//
//
// =====================================
//
// preferredEntryId
//
// Retained only for backward compatibility
// with older callers.
//
// It MUST NEVER override authoritative
// queue ordering.
// =====================================


const updateCurrentPlatformAthlete = async (
    competitionId,
    gender,
    preferredEntryId = null
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


    if (
        !["male", "female"].includes(
            normalizedGender
        )
    ) {

        throw new Error(
            "Invalid gender."
        );

    }


    console.log(
        "===== FEATURE 3.5 PLATFORM ASSIGNMENT ====="
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
        "Preferred Entry:",
        preferredEntryId?.toString() ??
            "NONE"
    );


    // =====================================
    // LOAD AUTHORITATIVE SESSION
    // =====================================

    const session =
        await LiveCompetition.findOne({

            competitionId,

            gender:
                normalizedGender,

        });


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
                "Live competition requires recovery. Automatic platform assignment is stopped."
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
                "Live competition integrity requires recovery. Automatic platform assignment is stopped."
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;

    }


    // =====================================
    // TERMINAL COMPETITION STATE
    // =====================================
    //
    // COMPLETED is terminal.
    //
    // No athlete may be assigned after
    // the competition has entered this phase.
    //
    // =====================================

    if (
        session.currentPhase ===
        "COMPLETED"
    ) {

        return {

            session,

            currentEntryId:
                session.currentEntryId ??
                null,

            assigned:
                false,

            platformPreserved:
                Boolean(
                    session.currentEntryId
                ),

            reason:
                "COMPETITION_COMPLETED",

        };

    }


    // =====================================
    // PLATFORM ALREADY OCCUPIED
    //
    // NEVER replace the athlete currently
    // on the platform.
    //
    // This is especially important because
    // this service may be called repeatedly
    // by different backend flows.
    // =====================================

    if (
        session.currentEntryId
    ) {

        console.log(
            "PLATFORM ALREADY OCCUPIED."
        );

        console.log(
            "Current Entry:",
            session.currentEntryId
                .toString()
        );


        return {

            session,

            currentEntryId:
                session.currentEntryId,

            assigned:
                false,

            platformPreserved:
                true,

            reason:
                "PLATFORM_OCCUPIED",

        };

    }


    // =====================================
    // RESOLVE AUTHORITATIVE QUEUE
    //
    // Feature 3.3 owns queue resolution.
    //
    // No local sorting is performed here.
    // =====================================

    const queueState =
        await recalculateQueue({

            competitionId,

            gender:
                normalizedGender,

        });


    const queue =
        Array.isArray(
            queueState?.queue
        )
            ? queueState.queue
            : [];


    // =====================================
    // NO ELIGIBLE ATHLETE
    //
    // IMPORTANT:
    //
    // Empty queue does NOT by itself mean
    // this service should mark the
    // competition completed.
    //
    // Phase transition / completion logic
    // belongs to the appropriate transition
    // service.
    // =====================================

    if (
        queue.length === 0
    ) {

        console.log(
            "NO ELIGIBLE QUEUE ATHLETE."
        );

        console.log(
            "PLATFORM REMAINS EMPTY."
        );


        return {

            session,

            currentEntryId:
                null,

            assigned:
                false,

            platformPreserved:
                false,

            reason:
                "QUEUE_EMPTY",

            declarationPending:
                Boolean(
                    queueState
                        ?.declarationPending
                ),

            declarationPendingCandidates:
                queueState
                    ?.declarationPendingCandidates ??
                [],

            rejectedCandidates:
                queueState
                    ?.rejectedCandidates ??
                [],

        };

    }


    // =====================================
    // AUTHORITATIVE NEXT ATHLETE
    //
    // The first item returned by the
    // authoritative queue is the ONLY
    // athlete eligible for platform
    // assignment.
    //
    // preferredEntryId is deliberately
    // ignored for selection.
    // =====================================

    const nextAthlete =
        queue[0] ??
        null;


    if (
        !nextAthlete
    ) {

        const error =
            new Error(
                "Authoritative queue contains candidates but no next athlete could be resolved."
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;

    }


    // =====================================
    // VALIDATE COMPETITION ENTRY ID
    // =====================================
    //
    // The confirmed queue contract is:
    //
    //     nextAthlete.entryId
    //
    // = CompetitionEntry._id
    //
    // This is what LiveCompetition.currentEntryId
    // stores.
    // =====================================

    const competitionEntryId =
        nextAthlete.entryId ??
        null;


    if (
        !competitionEntryId
    ) {

        const error =
            new Error(
                "Authoritative queue candidate is missing its CompetitionEntry ID."
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;

    }


    console.log(
        "===== AUTHORITATIVE PLATFORM ASSIGNMENT ====="
    );

    console.log({

        entryId:
            competitionEntryId
                .toString(),

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

    });


    // =====================================
    // AUTHORITATIVE ATTEMPT INFORMATION
    // =====================================

    const assignedPhase =
        nextAthlete.phase ??
        null;


    const assignedAttemptNo =
        nextAthlete.attemptNo ??
        null;


    const assignedDeclaredWeight =
        nextAthlete.declaredWeight ??
        null;


    // =====================================
    // VALIDATE PHASE
    // =====================================

    if (
        !assignedPhase
    ) {

        const error =
            new Error(
                "Authoritative queue candidate is missing its competition phase."
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
            assignedAttemptNo
        ) ||
        assignedAttemptNo < 1 ||
        assignedAttemptNo > 3
    ) {

        const error =
            new Error(
                "Authoritative queue candidate has an invalid attempt number."
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;

    }


    // =====================================
    // VALIDATE DECLARED WEIGHT
    // =====================================

    if (
        !Number.isFinite(
            Number(
                assignedDeclaredWeight
            )
        ) ||
        Number(
            assignedDeclaredWeight
        ) <= 0
    ) {

        const error =
            new Error(
                "Authoritative queue candidate has an invalid declared weight."
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;

    }


    // =====================================
    // RE-READ AUTHORITATIVE SESSION
    //
    // The first session read occurred before
    // queue calculation.
    //
    // Another request could have assigned
    // the platform during that time.
    //
    // Therefore re-read immediately before
    // mutation.
    // =====================================

    const latestSession =
        await LiveCompetition.findOne({

            _id:
                session._id,

        });


    if (!latestSession) {

        throw new Error(
            "Live competition session no longer exists."
        );

    }


    // =====================================
    // RECOVERY CHECK AGAIN
    // =====================================

    if (
        latestSession.status ===
        "RECOVERY_REQUIRED"
    ) {

        const error =
            new Error(
                "Live competition requires recovery. Automatic platform assignment is stopped."
            );

        error.code =
            "RECOVERY_REQUIRED";

        error.statusCode =
            409;

        throw error;

    }


    if (
        latestSession.integrity?.status ===
        "RECOVERY_REQUIRED"
    ) {

        const error =
            new Error(
                "Live competition integrity requires recovery. Automatic platform assignment is stopped."
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;

    }


    // =====================================
    // TERMINAL STATE CHECK AGAIN
    // =====================================

    if (
        latestSession.currentPhase ===
        "COMPLETED"
    ) {

        return {

            session:
                latestSession,

            currentEntryId:
                latestSession.currentEntryId ??
                null,

            assigned:
                false,

            platformPreserved:
                Boolean(
                    latestSession.currentEntryId
                ),

            reason:
                "COMPETITION_COMPLETED",

        };

    }


    // =====================================
    // PLATFORM BECAME OCCUPIED
    //
    // Another request won the race.
    //
    // Never overwrite it.
    // =====================================

    if (
        latestSession.currentEntryId
    ) {

        console.log(
            "PLATFORM BECAME OCCUPIED BEFORE ASSIGNMENT."
        );

        console.log(
            "Current Entry:",
            latestSession.currentEntryId
                .toString()
        );


        return {

            session:
                latestSession,

            currentEntryId:
                latestSession.currentEntryId,

            assigned:
                false,

            platformPreserved:
                true,

            reason:
                "PLATFORM_OCCUPIED",

        };

    }


    // =====================================
    // AUTHORITATIVE STATE VERSION
    //
    // Platform assignment is a persisted
    // state transition.
    // =====================================

    const previousStateVersion =
        latestSession.stateVersion;


    if (
        !Number.isInteger(
            previousStateVersion
        ) ||
        previousStateVersion < 0
    ) {

        const error =
            new Error(
                "Invalid LiveCompetition stateVersion. Recovery is required."
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;

    }


    // =====================================
    // ASSIGN ATHLETE TO PLATFORM
    //
    // CRITICAL:
    //
    // currentEntryId stores
    // CompetitionEntry._id.
    //


    latestSession.currentEntryId =
        competitionEntryId;


    // =====================================
    // ADVANCE STATE VERSION
    // =====================================

    latestSession.stateVersion =
        previousStateVersion + 1;


    // =====================================
    // PERSIST AUTHORITATIVE STATE
    // =====================================

    await latestSession.save();


    // =====================================
    // RESULT
    // =====================================

    console.log(
        "===== ATHLETE MOVED TO PLATFORM ====="
    );

    console.log(
        "Current Entry:",
        latestSession.currentEntryId
            ?.toString() ??
        "NONE"
    );

    console.log(
        "Previous State Version:",
        previousStateVersion
    );

    console.log(
        "New State Version:",
        latestSession.stateVersion
    );


    // =====================================
    // RETURN AUTHORITATIVE RESULT
    // =====================================

    return {

        session:
            latestSession,

        currentEntryId:
            latestSession.currentEntryId,

        assigned:
            true,

        platformPreserved:
            false,

        reason:
            "ATHLETE_ASSIGNED",

        athlete:
            nextAthlete,

        assignment: {

            // CompetitionEntry ID
            entryId:
                competitionEntryId,

            name:
                nextAthlete.name,

            lotNumber:
                nextAthlete.lotNumber,

            phase:
                assignedPhase,

            attemptNo:
                assignedAttemptNo,

            declaredWeight:
                assignedDeclaredWeight,

        },

        previousStateVersion,

        stateVersion:
            latestSession.stateVersion,

    };

};


export default updateCurrentPlatformAthlete;