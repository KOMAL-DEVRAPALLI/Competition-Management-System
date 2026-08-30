import LiveCompetition from "../../models/LiveCompetition.js";

import buildWorkingSheetData
    from "../pdf/workingSheet/buildWorkingSheetData.js";

import getCurrentAttempt
    from "./getCurrentAttempt.js";

import getEligibleQueueCandidates
    from "./getEligibleQueueCandidates.js";

import recalculateQueue
    from "./recalculateQueue.js";

import {
    getAttemptWeight,
} from "./selectNextAthlete.js";


// =====================================
// MAP QUEUE ATHLETE
// =====================================
//
// IMPORTANT:
// phase is passed explicitly.
// Do NOT access `session` from here.
// =====================================

const mapQueueAthlete = (
    entry,
    phase,
    status
) => {

    if (!entry) {
        return null;
    }


    const attempt =
        getCurrentAttempt(
            entry.competitionEntry,
            phase
        );


    return {

        entryId:
            entry.entryId,

        athleteId:
            entry.athleteId,

        name:
            entry.name,

        registrationNo:
            entry.registrationNo,

        lotNumber:
            entry.lotNumber,

        bodyWeight:
            entry.bodyWeight,

        weightCategory:
            entry.weightCategory,

        displayWeightCategory:
            entry.displayWeightCategory,

        openingSnatch:
            entry.openingSnatch,

        openingCleanJerk:
            entry.openingCleanJerk,

        bestSnatch:
            entry.bestSnatch,

        bestCleanJerk:
            entry.bestCleanJerk,

        total:
            entry.total,

        place:
            entry.place,

        phase:
            attempt?.phase ?? null,

        attemptNo:
            attempt?.attemptNo ?? null,

        declaredWeight:
            attempt?.declaredWeight ?? null,

        applicableWeight:
            getAttemptWeight(
                entry.competitionEntry,
                attempt
            ),

        result:
            attempt?.result ?? null,

        completed:
            attempt?.completed ?? false,

        currentAttempt:
            attempt ?? null,

        snatchAttempts:
            entry
                .competitionEntry
                ?.snatchAttempts ?? [],

        cleanJerkAttempts:
            entry
                .competitionEntry
                ?.cleanJerkAttempts ?? [],

        competitionEntry:
            entry.competitionEntry,

        status,

    };

};


// =====================================
// GET LIVE COMPETITION
//
// Feature 3.4
//
// READ ONLY.
//
// Does NOT:
// - select athlete
// - change currentEntryId
// - modify attempts
// - modify declarations
// - increment stateVersion
// =====================================

const getLiveCompetition = async (
    competitionId,
    gender
) => {

    // =================================
    // VALIDATION
    // =================================

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


    // =================================
    // LOAD LIVE SESSION
    // =================================

    const session =
        await LiveCompetition.findOne({

            competitionId,

            gender:
                normalizedGender,

        });

console.log("===== LIVE SESSION DEBUG =====");

console.log({
    requestedCompetitionId: String(competitionId),
    requestedGender: normalizedGender,

    sessionId: session?._id?.toString() ?? null,
    sessionCompetitionId:
        session?.competitionId?.toString() ?? null,

    sessionGender: session?.gender ?? null,
    sessionStatus: session?.status ?? null,
    sessionIntegrityStatus:
        session?.integrity?.status ?? null,

    sessionIntegrityReason:
        session?.integrity?.reason ?? null,

    currentPhase:
        session?.currentPhase ?? null,

    currentEntryId:
        session?.currentEntryId?.toString() ?? null,

    stateVersion:
        session?.stateVersion ?? null,
});
    if (!session) {

        throw new Error(
            "Live competition has not been started."
        );

    }


    // =================================
    // RECOVERY SAFETY
    // =================================

    if (
        session.status ===
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
        session.integrity?.status ===
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
    // LOAD ACTIVE ATHLETES
    // =================================

    const entries =
        await buildWorkingSheetData(

            competitionId,

            normalizedGender,

            true,

            session.selectedWeightCategories

        );


    if (!Array.isArray(entries)) {

        throw new Error(
            "Unable to load competition athletes."
        );

    }


    // =================================
    // EMPTY SESSION
    // =================================

    if (entries.length === 0) {

        return {

            status:
                session.status,

            sessionName:
                session.sessionName,

            selectedWeightCategories:
                session.selectedWeightCategories,

            currentPhase:
                session.currentPhase,

            currentAthlete:
                null,

            canSelectAnotherAthlete:
                false,

            nextAthlete:
                null,

            upcomingAthletes:
                [],

            queue:
                [],

            queueCount:
                0,

            athletes:
                [],

            competitionResults:
                [],

            declarationQueue:
                [],

            totalAthletes:
                0,

            currentEntryId:
                session.currentEntryId ?? null,

            stateVersion:
                session.stateVersion ?? 0,

            integrity:
                session.integrity,

        };

    }


    // =================================
    // BUILD ENTRY MAP
    // =================================

    const entryMap =
        new Map(

            entries.map(
                (entry) => [

                    String(
                        entry.entryId
                    ),

                    entry,

                ]
            )

        );


    // =================================
    // CURRENT ATHLETE
    // =================================

    let currentAthlete =
        null;


    if (
        session.currentEntryId
    ) {

        const currentEntry =
            entryMap.get(

                String(
                    session.currentEntryId
                )

            );


        if (!currentEntry) {

            const error =
                new Error(
                    "Current platform athlete is not present in the active competition scope."
                );

            error.code =
                "QUEUE_INTEGRITY_ERROR";

            error.statusCode =
                409;

            throw error;

        }


        currentAthlete =
            mapQueueAthlete(

                currentEntry,

                session.currentPhase,

                "ON_PLATFORM"

            );

    }


    // =================================
    // GET ELIGIBLE CANDIDATES
    //
    // Feature 3.1
    //
    // We call this explicitly here so
    // GET /live-competition also exposes
    // the authoritative queue.
    // =================================

    const candidateResult =
        await getEligibleQueueCandidates({

            competitionId,

            gender:
                normalizedGender,

            phase:
                session.currentPhase,

            selectedWeightCategories:
                session.selectedWeightCategories,

            currentEntryId:
                session.currentEntryId ?? null,

            allowCurrentEntry:
                false,

        });


    const candidates =
        Array.isArray(
            candidateResult?.candidates
        )
            ? candidateResult.candidates
            : [];


    // =================================
    // ORDER QUEUE
    //
    // Feature 3.2
    // =================================

    const orderedCandidates =
        [...candidates].sort(

            (a, b) => {

                // ---------------------------------
                // IMPORTANT:
                //
                // orderQueue() is authoritative.
                // ---------------------------------

                return 0;

            }

        );


    // =================================
    // USE CENTRAL ORDERING ENGINE
    //
    // Import dynamically avoided.
    // Instead use recalculateQueue below,
    // which already owns the ordering.
    // =================================

    const recalculated =
        await recalculateQueue({

            competitionId,

            gender:
                normalizedGender,

            allowCurrentEntry:
                false,

        });


    const queue =
        Array.isArray(
            recalculated?.queue
        )
            ? recalculated.queue
            : [];


    const nextEntry =
        recalculated?.nextAthlete ??
        null;


    const upcomingEntries =
        Array.isArray(
            recalculated?.upcoming
        )
            ? recalculated.upcoming
            : [];


    // =================================
    // MAP NEXT ATHLETE
    // =================================

    const nextAthlete =
        nextEntry

            ? mapQueueAthlete(

                nextEntry,

                session.currentPhase,

                "NEXT"

            )

            : null;


    // =================================
    // MAP UPCOMING
    // =================================

    const upcomingAthletes =
        upcomingEntries.map(

            (entry) =>
                mapQueueAthlete(

                    entry,

                    session.currentPhase,

                    "UPCOMING"

                )

        );


    // =================================
    // MAP FULL QUEUE
    // =================================

    const mappedQueue =
        queue.map(

            (entry) =>
                mapQueueAthlete(

                    entry,

                    session.currentPhase,

                    "QUEUED"

                )

        );


    // =================================
    // BUILD ALL ATHLETE LIST
    // =================================

    const athletes =
        entries.map(

            (entry) => {

                const attempt =
                    getCurrentAttempt(

                        entry.competitionEntry,

                        session.currentPhase

                    );


                let status =
                    "AVAILABLE";


                if (
                    session.currentEntryId &&
                    String(entry.entryId) ===
                    String(session.currentEntryId)
                ) {

                    status =
                        "ON_PLATFORM";

                }
                else if (
                    attempt?.completed
                ) {

                    status =
                        "COMPLETED";

                }
                else if (
                    attempt &&
                    attempt.phase !==
                    session.currentPhase
                ) {

                    status =
                        "WRONG_PHASE";

                }


                return mapQueueAthlete(

                    entry,

                    session.currentPhase,

                    status

                );

            }

        );


    // =================================
    // COMPETITION RESULTS
    //
    // Keep same athlete information
    // for existing frontend compatibility.
    // =================================

    const competitionResults =
        athletes.map(

            (athlete) => ({
                ...athlete,
            })

        );


    // =================================
    // CAN SELECT / PLATFORM STATE
    // =================================

    let canSelectAnotherAthlete =
        true;


    if (
        currentAthlete
    ) {

        const attempt =
            currentAthlete.currentAttempt;


        if (
            !attempt
        ) {

            canSelectAnotherAthlete =
                false;

        }
        else if (
            attempt.completed
        ) {

            canSelectAnotherAthlete =
                true;

        }
        else if (
            attempt.phase !==
            session.currentPhase
        ) {

            canSelectAnotherAthlete =
                true;

        }
        else {

            const declaredWeight =
                attempt.declaredWeight;


            canSelectAnotherAthlete =
                declaredWeight != null &&
                Number(declaredWeight) > 0;

        }

    }


    // =================================
    // DEBUG
    // =================================

    console.log(
        "===== GET LIVE COMPETITION ====="
    );

    console.log({

        competitionId:
            String(competitionId),

        gender:
            normalizedGender,

        currentPhase:
            session.currentPhase,

        status:
            session.status,

        currentEntryId:
            session.currentEntryId
                ?.toString() ?? null,

        eligibleCandidates:
            candidates.length,

        queueCount:
            queue.length,

        next:
            nextAthlete?.name ?? null,

        upcoming:
            upcomingAthletes.length,

    });


    // =================================
    // AUTHORITATIVE RESPONSE
    // =================================

    return {

        competitionId:
            session.competitionId,

        gender:
            session.gender,

        status:
            session.status,

        sessionName:
            session.sessionName,

        selectedWeightCategories:
            session.selectedWeightCategories,

        currentPhase:
            session.currentPhase,

        currentEntryId:
            session.currentEntryId ?? null,

        stateVersion:
            session.stateVersion ?? 0,

        integrity:
            session.integrity,

        currentAthlete,

        canSelectAnotherAthlete,

        nextAthlete,

        upcomingAthletes,

        queue:
            mappedQueue,

        queueCount:
            mappedQueue.length,

        athletes,

        competitionResults,

        declarationQueue:
            mappedQueue,

        totalAthletes:
            athletes.length,

    };

};


// =====================================
// QUEUE STATE
//
// Used by:
// GET /:competitionId/:gender/queue
//
// Kept in this file so both endpoints
// use the same authoritative logic.
// =====================================

const getQueueState = async ({
    competitionId,
    gender,
}) => {

    const result =
        await getLiveCompetition(
            competitionId,
            gender
        );


    return {

        competitionId:
            result.competitionId,

        gender:
            result.gender,

        sessionName:
            result.sessionName,

        selectedWeightCategories:
            result.selectedWeightCategories,

        currentPhase:
            result.currentPhase,

        status:
            result.status,

        stateVersion:
            result.stateVersion,

        integrity:
            result.integrity,

        current:
            result.currentAthlete,

        next:
            result.nextAthlete,

        upcoming:
            result.upcomingAthletes,

        queue:
            result.queue,

        queueCount:
            result.queueCount,

    };

};


// =====================================
// EXPORTS
// =====================================

export {
    getQueueState,
};

export default getLiveCompetition;