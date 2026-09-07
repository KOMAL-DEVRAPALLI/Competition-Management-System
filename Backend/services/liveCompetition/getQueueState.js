import LiveCompetition from "../../models/LiveCompetition.js";

import buildWorkingSheetData
    from "../pdf/workingSheet/buildWorkingSheetData.js";

import getCurrentAttempt
    from "./getCurrentAttempt.js";

import recalculateQueue
    from "./recalculateQueue.js";

import {
    getAttemptWeight,
} from "./selectNextAthlete.js";


// =====================================
// MAP QUEUE ATHLETE
// =====================================

const mapQueueAthlete = (
    entry,
    status,
    currentPhase
) => {

    if (!entry) {

        return null;

    }


    const attempt =
        getCurrentAttempt(
            entry.competitionEntry,
            currentPhase
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

        event:
            entry.isYouth
                ? "Y"
                : entry.isJunior
                    ? "J"
                    : entry.isSenior
                        ? "S"
                        : "",

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
                entry,
                attempt
            ),

        result:
            attempt?.result ?? null,

        completed:
            attempt?.completed ?? false,

        status,

        currentAttempt:
            attempt ?? null,

    };

};


// =====================================
// MAP DECLARATION-REQUIRED ATHLETE
// =====================================

const mapDeclarationRequiredAthlete = (
    entry,
    currentPhase
) => {

    const mapped =
        mapQueueAthlete(

            entry,

            "DECLARATION_REQUIRED",

            currentPhase

        );


    if (!mapped) {

        return null;

    }


    return {

        ...mapped,

        declarationRequired:
            true,

    };

};


// =====================================
// GET AUTHORITATIVE QUEUE STATE
//
// IMPORTANT STATE CONTRACT:
//
// current:
//     Calling-order current athlete.
//
// platform:
//     Physical athlete currently on platform.
//
// These may intentionally differ.
//
// Example:
//
// current  = B
// platform = C
// next     = C
//
// This service is READ ONLY.
// =====================================

const getQueueState = async ({
    competitionId,
    gender,
}) => {

    // =================================
    // VALIDATE INPUT
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
    // LOAD AUTHORITATIVE SESSION
    // =================================

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


    // =================================
    // RECOVERY SAFETY
    // =================================

    if (
        session.status ===
        "RECOVERY_REQUIRED"
    ) {

        const error =
            new Error(
                "Live competition requires recovery. Queue state cannot be exposed automatically."
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
                "Live competition integrity requires recovery. Queue state cannot be exposed automatically."
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;

    }


    // =================================
    // TERMINAL COMPETITION STATE
    // =================================

    if (
        session.currentPhase ===
        "COMPLETED"
    ) {

        return {

            competitionId:
                session.competitionId,

            gender:
                session.gender,

            sessionName:
                session.sessionName,

            selectedWeightCategories:
                session.selectedWeightCategories,

            currentPhase:
                "COMPLETED",

            status:
                session.status,

            stateVersion:
                session.stateVersion,

            integrity:
                session.integrity,

            currentEntryId:
                null,

            platformEntryId:
                null,

            current:
                null,

            platform:
                null,

            next:
                null,

            upcoming:
                [],

            queue:
                [],

            queueCount:
                0,

            declarationRequired:
                [],

            declarationRequiredCount:
                0,

            competitionCompleted:
                true,

        };

    }


    // =================================
    // LOAD ACTIVE ENTRIES
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
    // CURRENT CALLING ATHLETE
    // =================================

    let current =
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
                    "Current calling athlete is not present in the active competition scope."
                );

            error.code =
                "QUEUE_INTEGRITY_ERROR";

            error.statusCode =
                409;

            throw error;

        }


        current =
            mapQueueAthlete(

                currentEntry,

                "CURRENT",

                session.currentPhase

            );

    }


    // =================================
    // PHYSICAL PLATFORM ATHLETE
    // =================================

    let platform =
        null;


    if (
        session.platformEntryId
    ) {

        const platformEntry =
            entryMap.get(

                String(
                    session.platformEntryId
                )

            );


        if (!platformEntry) {

            const error =
                new Error(
                    "Physical platform athlete is not present in the active competition scope."
                );

            error.code =
                "QUEUE_INTEGRITY_ERROR";

            error.statusCode =
                409;

            throw error;

        }


        platform =
            mapQueueAthlete(

                platformEntry,

                "ON_PLATFORM",

                session.currentPhase

            );

    }


    // =================================
    // BACKWARD COMPATIBILITY
    // =================================
    //
    // Older sessions may not have
    // platformEntryId.
    //
    // Do not write to the database here.
    // =================================

    if (
        !platform &&
        current
    ) {

        platform = {

            ...current,

            status:
                "ON_PLATFORM",

        };

    }


    // =================================
    // RECALCULATE WAITING QUEUE
    //
    // The queue engine remains
    // authoritative.
    // =================================

    const recalculated =
        await recalculateQueue({

            competitionId,

            gender:
                normalizedGender,

            allowCurrentEntry:
                false,

        });


    const orderedQueue =
        Array.isArray(
            recalculated.queue
        )
            ? recalculated.queue
            : [];


    // =================================
    // DECLARATION-REQUIRED ATHLETES
    // =================================

    const rejected =
        Array.isArray(
            recalculated.rejectedCandidates
        )
            ? recalculated.rejectedCandidates
            : [];


    const declarationRequired =
        rejected

            .filter(
                (candidate) =>
                    candidate?.reason ===
                    "DECLARATION_REQUIRED"
            )

            .map(
                (candidate) => {

                    const entry =
                        entries.find(

                            (item) =>
                                String(
                                    item.entryId
                                ) ===
                                String(
                                    candidate.entryId
                                )

                        );


                    if (!entry) {

                        return null;

                    }


                    return mapDeclarationRequiredAthlete(

                        entry,

                        session.currentPhase

                    );

                }

            )

            .filter(Boolean);


    // =================================
    // NEXT ATHLETE
    // =================================

    const next =
        orderedQueue.length > 0

            ? mapQueueAthlete(

                orderedQueue[0],

                "NEXT",

                session.currentPhase

            )

            : null;


    // =================================
    // UPCOMING ATHLETES
    // =================================

    const upcoming =
        orderedQueue

            .slice(1)

            .map(

                (entry) =>
                    mapQueueAthlete(

                        entry,

                        "UPCOMING",

                        session.currentPhase

                    )

            );


    // =================================
    // FULL QUEUE
    // =================================

    const queue =
        orderedQueue.map(

            (entry) =>
                mapQueueAthlete(

                    entry,

                    "QUEUED",

                    session.currentPhase

                )

        );


    // =================================
    // AUTHORITATIVE RESPONSE
    // =================================

    return {

        competitionId:
            session.competitionId,

        gender:
            session.gender,

        sessionName:
            session.sessionName,

        selectedWeightCategories:
            session.selectedWeightCategories,

        currentPhase:
            session.currentPhase,

        status:
            session.status,

        stateVersion:
            session.stateVersion,

        integrity:
            session.integrity,

        // =================================
        // SEPARATED CURRENT / PLATFORM
        // =================================

        currentEntryId:
            session.currentEntryId ?? null,

        platformEntryId:
            session.platformEntryId ?? null,

        current,

        platform,

        // =================================
        // CALLING ORDER
        // =================================

        next,

        upcoming,

        queue,

        queueCount:
            queue.length,

        // =================================
        // DECLARATION REQUIRED
        // =================================

        declarationRequired,

        declarationRequiredCount:
            declarationRequired.length,

        // =================================
        // ACTIVE COMPETITION
        // =================================

        competitionCompleted:
            false,

    };

};


export default getQueueState;