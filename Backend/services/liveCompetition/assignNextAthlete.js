import LiveCompetition from "../../models/LiveCompetition.js";

import recalculateQueue
    from "./recalculateQueue.js";


// =====================================
// FEATURE 3.4
// AUTOMATIC NEXT-ATHLETE ASSIGNMENT
//
// Responsibility:
//
// 1. Read authoritative live state.
// 2. Resolve the authoritative queue.
// 3. Take the first eligible candidate.
// 4. Assign that candidate to the platform.
// 5. Increment stateVersion.
// 6. Persist the state change.
//
// IMPORTANT:
//
// This service NEVER accepts an entryId
// from the caller.
//
// The queue engine decides who goes next.
//
// Flow:
//
// LiveCompetition
//      ↓
// recalculateQueue()
//      ↓
// nextAthlete
//      ↓
// currentEntryId
//      ↓
// stateVersion++
//
// =====================================


const assignNextAthlete = async ({
    competitionId,
    gender,
    expectedStateVersion,
    dbSession = null,
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
    // VALIDATE STATE VERSION
    // =====================================

    if (
        !Number.isInteger(
            session.stateVersion
        ) ||
        session.stateVersion < 0
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
        session.stateVersion
    ) {

        const error =
            new Error(
                "Live competition state has changed. Refresh before advancing the platform."
            );

        error.code =
            "STALE_STATE";

        error.statusCode =
            409;

        error.expectedStateVersion =
            expectedStateVersion;

        error.currentStateVersion =
            session.stateVersion;

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
                "Live competition requires recovery. Automatic athlete assignment is stopped."
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
                "Live competition integrity requires recovery. Automatic athlete assignment is stopped."
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;

    }


    // =====================================
    // PLATFORM ALREADY OCCUPIED
    //
    // Automatic assignment must never
    // overwrite the athlete currently
    // occupying the platform.
    // =====================================

    if (session.currentEntryId) {

        const error =
            new Error(
                "The platform is already occupied by an athlete."
            );

        error.code =
            "PLATFORM_OCCUPIED";

        error.statusCode =
            409;

        throw error;

    }


    // =====================================
    // RESOLVE AUTHORITATIVE QUEUE
    //
    // IMPORTANT:
    //
    // allowCurrentEntry is FALSE here.
    //
    // There is no current athlete because
    // the platform is empty.
    // =====================================

    const queueState =
        await recalculateQueue({

            competitionId,

            gender:
                normalizedGender,

            dbSession,

            allowCurrentEntry:
                false,

        });


    // =====================================
    // NO ELIGIBLE ATHLETE
    // =====================================

    const nextAthlete =
        queueState.nextAthlete;


    if (!nextAthlete) {

        return {

            session,

            stateVersion:
                session.stateVersion,

            assigned:
                false,

            athlete:
                null,

            queue:
                queueState.queue,

            upcoming:
                queueState.upcoming,

            candidateCount:
                queueState.candidateCount,

            reason:
                "NO_ELIGIBLE_ATHLETE",

        };

    }


    // =====================================
    // DEFENSIVE ENTRY-ID VALIDATION
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
    // ASSIGN AUTHORITATIVE ATHLETE
    //
    // This is the ONLY point in this
    // service where currentEntryId changes.
    // =====================================

    session.currentEntryId =
        nextAthlete.entryId;


    session.status =
        "RUNNING";


    // =====================================
    // STATE VERSION
    // =====================================

    session.stateVersion =
        session.stateVersion + 1;


    // =====================================
    // PERSIST
    // =====================================

    if (dbSession) {

        await session.save({
            session:
                dbSession,
        });

    } else {

        await session.save();

    }


    // =====================================
    // RETURN AUTHORITATIVE RESULT
    // =====================================

    return {

        session,

        stateVersion:
            session.stateVersion,

        assigned:
            true,

        athlete:
            nextAthlete,

        currentEntryId:
            session.currentEntryId,

        queue:
            queueState.queue,

        upcoming:
            queueState.upcoming,

        candidateCount:
            queueState.candidateCount,

        reason:
            "NEXT_ATHLETE_ASSIGNED",

    };

};


export default assignNextAthlete;