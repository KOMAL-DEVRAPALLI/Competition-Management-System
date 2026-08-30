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
// FEATURE 3.4
// AUTHORITATIVE QUEUE STATE EXPOSURE
//
// READ ONLY.
//
// Responsibilities:
//
// 1. Read authoritative live session.
// 2. Resolve current platform athlete.
// 3. Resolve next athlete.
// 4. Resolve upcoming athletes.
// 5. Expose authoritative queue.
// 6. Expose athletes whose next attempt
//    requires declaration before they can
//    enter the calling queue.
//
// TERMINAL STATE:
//
// When currentPhase === "COMPLETED":
//
// - current = null
// - next = null
// - upcoming = []
// - queue = []
// - queueCount = 0
// - declarationRequired = []
//
// recalculateQueue() MUST NOT be called
// for COMPLETED because it is an active-phase
// queue engine.
//
// This service MUST NOT:
//
// - assign currentEntryId
// - modify attempts
// - modify results
// - modify declarations
// - increment stateVersion
// - select an athlete
// =====================================


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

        // IMPORTANT:
        //
        // getAttemptWeight() expects the
        // complete queue candidate because
        // it resolves candidate.competitionEntry.
        //
        // Do NOT pass entry.competitionEntry
        // directly.
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
//
// These athletes are NOT yet part of the
// calling queue because their next attempt
// does not have a declared weight.
//
// They MUST nevertheless remain visible to
// Officials so that the declaration can be
// entered.
//
// IMPORTANT:
//
// This does NOT make them queue candidates.
//
// Once declaration is saved, the normal
// queue engine will recalculate and place
// them according to calling-order rules.
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
    //
    // COMPLETED is not an active queue
    // phase.
    //
    // Therefore do not call
    // recalculateQueue().
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

            current:
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
    // RECALCULATE WAITING QUEUE
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
    // CURRENT PLATFORM ATHLETE
    // =================================

    let current = null;


    if (
        session.currentEntryId
    ) {

        const currentEntry =
            entries.find(
                (entry) =>
                    String(
                        entry.entryId
                    ) ===
                    String(
                        session.currentEntryId
                    )
            );


        // ---------------------------------
        // NEVER GUESS ON CONTRADICTION
        // ---------------------------------

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


        current =
            mapQueueAthlete(
                currentEntry,
                "ON_PLATFORM",
                session.currentPhase
            );

    }


    // =================================
    // DECLARATION-REQUIRED ATHLETES
    // =================================
    //
    // IMPORTANT:
    //
    // recalculateQueue() returns:
    //
    // rejectedCandidates
    //
    // NOT:
    //
    // rejected
    //
    // Use the authoritative property.
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

        currentEntryId:
            session.currentEntryId ?? null,

        current,

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


// =====================================
// EXPORT
// =====================================

export default getQueueState;