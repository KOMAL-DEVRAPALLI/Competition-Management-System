import LiveCompetition from "../../models/LiveCompetition.js";

import Competition
    from "../../models/Competition.js";

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
// COMPETITION FORMAT
// =====================================

const TOTAL_ONLY =
    "TOTAL_ONLY";


// =====================================
// GET ATTEMPT BY NUMBER
//
// Uses the authoritative attempt number,
// not array position.
// =====================================

const getAttemptByNumber = (
    attempts,
    attemptNo
) => {

    if (
        !Array.isArray(
            attempts
        )
    ) {

        return null;

    }


    return (
        attempts.find(
            (attempt) =>
                Number(
                    attempt?.attemptNo
                ) === attemptNo
        ) ??
        null
    );

};


// =====================================
// GET SNATCH BOMB-OUT STATE
//
// Presentation state is derived here from
// authoritative CompetitionEntry state.
//
// IMPORTANT:
//
// This does NOT determine queue order.
//
// Queue eligibility remains handled by:
//     getEligibleQueueCandidates()
//     recalculateQueue()
//
// This function only exposes the already
// applicable competition state to the UI.
//
// IMPORTANT:
//
// Do NOT require CLEAN_JERK here.
//
// Once attempts 1, 2 and 3 are all
// authoritative NO_LIFT results, the athlete
// is already in the three-failed-Snatch state.
//
// The competition transition service remains
// responsible for the actual SNATCH ->
// CLEAN_JERK / COMPLETED transition.
//
// This mapper simply exposes the state so the
// Officials/Results UI can immediately show:
//
//     ELIMINATED
//     SNATCH_BOMB_OUT
//
// even if a read occurs immediately before
// the phase transition is reflected.
// =====================================

export const getSnatchBombOutState = (
    entry,
    competitionFormat
) => {

    // =====================================
    // Bomb-out applies only to TOTAL_ONLY.
    // =====================================

    if (
        competitionFormat !==
        TOTAL_ONLY
    ) {

        return {

            eliminated:
                false,

            eliminationReason:
                null,

        };

    }


    const competitionEntry =
        entry?.competitionEntry;


    const snatchAttempts =
        competitionEntry
            ?.snatchAttempts;


    if (
        !Array.isArray(
            snatchAttempts
        )
    ) {

        return {

            eliminated:
                false,

            eliminationReason:
                null,

        };

    }


    // =====================================
    // REQUIRE EXACT ATTEMPTS 1, 2, 3
    //
    // Do not rely on array indexes.
    // =====================================

    const snatch1 =
        getAttemptByNumber(
            snatchAttempts,
            1
        );


    const snatch2 =
        getAttemptByNumber(
            snatchAttempts,
            2
        );


    const snatch3 =
        getAttemptByNumber(
            snatchAttempts,
            3
        );


    if (
        !snatch1 ||
        !snatch2 ||
        !snatch3
    ) {

        return {

            eliminated:
                false,

            eliminationReason:
                null,

        };

    }


    // =====================================
    // THREE FAILED SNATCHES
    // =====================================

    const threeFailedSnatches =
        snatch1.result === "NO_LIFT" &&
        snatch2.result === "NO_LIFT" &&
        snatch3.result === "NO_LIFT";


    if (
        !threeFailedSnatches
    ) {

        return {

            eliminated:
                false,

            eliminationReason:
                null,

        };

    }


    return {

        eliminated:
            true,

        eliminationReason:
            "SNATCH_BOMB_OUT",

    };

};


// =====================================
// MAP QUEUE ATHLETE
// =====================================
//
// IMPORTANT:
// phase is passed explicitly.
// Do NOT access `session` from here.
//
// This mapper is used for:
// - calling current
// - physical platform
// - next
// - upcoming
// - queue
// - all-athlete state
//
// Elimination state is presentation state
// derived from the authoritative competition
// configuration and CompetitionEntry history.
// =====================================

const mapQueueAthlete = (
    entry,
    phase,
    status,
    competitionFormat
) => {

    if (!entry) {

        return null;

    }


    const attempt =
        getCurrentAttempt(
            entry.competitionEntry,
            phase
        );


    const bombOutState =
        getSnatchBombOutState(
            entry,
            competitionFormat
        );


    const resolvedStatus =
        bombOutState.eliminated
            ? "ELIMINATED"
            : status;


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
        ageCategory:
            entry.ageCategory,
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

        status:
            resolvedStatus,

        // =================================
        // AUTHORITATIVE ELIMINATION STATE
        // =================================

        eliminated:
            bombOutState.eliminated,

        eliminationReason:
            bombOutState.eliminationReason,

    };

};


// =====================================
// GET LIVE COMPETITION
//
// READ ONLY.
//
// IMPORTANT STATE CONTRACT:
//
// currentEntryId:
//     Calling-order current athlete.
//
// platformEntryId:
//     Physical athlete currently on platform.
//
// These are intentionally separate.
//
// A declaration correction can therefore
// produce:
//
// current = B
// platform = C
//
// without losing the physical platform
// state.
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


    if (!session) {

        throw new Error(
            "Live competition has not been started."
        );

    }


    // =================================
    // LOAD COMPETITION FORMAT
    //
    // Competition.competitionFormat is
    // the authoritative source.
    // =================================

    const competition =
        await Competition.findById(
            competitionId
        )
            .select(
                "competitionFormat"
            )
            .lean();


    if (!competition) {

        const error =
            new Error(
                "Competition not found."
            );

        error.code =
            "COMPETITION_NOT_FOUND";

        error.statusCode =
            404;

        throw error;

    }


    const competitionFormat =
        competition.competitionFormat ??
        null;


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

            currentAthlete:
                null,

            platformAthlete:
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

            platformEntryId:
                session.platformEntryId ?? null,

            stateVersion:
                session.stateVersion ?? 0,

            integrity:
                session.integrity,

            competitionFormat,

        };

    }


    // =====================================
    // COMPLETED COMPETITION
    //
    // IMPORTANT:
    //
    // A completed competition has no active
    // calling queue.
    //
    // Do NOT call:
    //
    // - getCurrentAttempt()
    // - getEligibleQueueCandidates()
    // - recalculateQueue()
    //
    // The result rows remain available for:
    //
    // - Officials Screen
    // - Public Scoreboard
    // - Final Result PDF
    //
    // This prevents the queue engine from
    // receiving the unsupported COMPLETED
    // phase.
    // =====================================

    if (
        session.currentPhase ===
        "COMPLETED"
    ) {

        const competitionResults =
            entries.map(
                (entry) => {

                    const bombOutState =
                        getSnatchBombOutState(
                            entry,
                            competitionFormat
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

                        // No active attempt exists
                        // after competition completion.

                        phase:
                            null,

                        attemptNo:
                            null,

                        declaredWeight:
                            null,

                        applicableWeight:
                            null,

                        result:
                            null,

                        completed:
                            true,

                        currentAttempt:
                            null,

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

                        status:
                            bombOutState.eliminated
                                ? "ELIMINATED"
                                : "COMPLETED",

                        eliminated:
                            bombOutState.eliminated,

                        eliminationReason:
                            bombOutState
                                .eliminationReason,

                    };

                }
            );


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

            competitionFormat,

            // =================================
            // NO ACTIVE CALLING STATE
            // =================================

            currentEntryId:
                null,

            platformEntryId:
                null,

            currentAthlete:
                null,

            platformAthlete:
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

            // =================================
            // FINAL RESULT DATA
            // =================================

            athletes:
                competitionResults,

            competitionResults,

            declarationQueue:
                [],

            totalAthletes:
                competitionResults.length,

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
    // CALLING CURRENT ATHLETE
    // =================================
    //
    // currentEntryId means:
    //
    // "current according to calling order"
    //
    // It does NOT necessarily mean the
    // physical platform athlete.
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
                    "Current calling athlete is not present in the active competition scope."
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

                "CURRENT",

                competitionFormat

            );

    }


    // =================================
    // PHYSICAL PLATFORM ATHLETE
    // =================================
    //
    // IMPORTANT:
    //
    // platformEntryId identifies the athlete
    // who is physically on the platform.
    //
    // It can differ from currentEntryId.
    //
    // Example:
    //
    // currentEntryId  = B
    // platformEntryId = C
    //
    // This state is valid during an
    // authoritative declaration correction.
    // =================================

    let platformAthlete =
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


        platformAthlete =
            mapQueueAthlete(

                platformEntry,

                session.currentPhase,

                "ON_PLATFORM",

                competitionFormat

            );

    }


    // =================================
    // BACKWARD COMPATIBILITY
    //
    // Older sessions may not have
    // platformEntryId populated.
    //
    // In that case, currentEntryId remains
    // the only available platform reference.
    //
    // Do NOT overwrite the database here.
    // This is read-only recovery behavior.
    // =================================

    if (
        !platformAthlete &&
        session.currentEntryId
    ) {

        platformAthlete =
            currentAthlete
                ? {
                    ...currentAthlete,
                    status: "ON_PLATFORM",
                }
                : null;

    }


    // =================================
    // GET ELIGIBLE CANDIDATES
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
    // CENTRAL QUEUE ENGINE
    //
    // DO NOT implement ordering here.
    // recalculateQueue remains authoritative.
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

                "NEXT",

                competitionFormat

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

                    "UPCOMING",

                    competitionFormat

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

                    "QUEUED",

                    competitionFormat

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
                    session.platformEntryId &&
                    String(entry.entryId) ===
                    String(session.platformEntryId)
                ) {

                    status =
                        "ON_PLATFORM";

                }
                else if (
                    session.currentEntryId &&
                    String(entry.entryId) ===
                    String(session.currentEntryId)
                ) {

                    status =
                        "CURRENT";

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

                    status,

                    competitionFormat

                );

            }

        );


    // =================================
    // COMPETITION RESULTS
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
        platformAthlete
    ) {

        const attempt =
            platformAthlete.currentAttempt;


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

        competitionFormat,

        currentPhase:
            session.currentPhase,

        status:
            session.status,

        currentEntryId:
            session.currentEntryId
                ?.toString() ?? null,

        platformEntryId:
            session.platformEntryId
                ?.toString() ?? null,

        currentAthlete:
            currentAthlete?.name ?? null,

        platformAthlete:
            platformAthlete?.name ?? null,

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

        // =================================
        // COMPETITION FORMAT
        // =================================

        competitionFormat,

        // =================================
        // SEPARATED STATE
        // =================================

        currentEntryId:
            session.currentEntryId ?? null,

        platformEntryId:
            session.platformEntryId ?? null,

        currentAthlete,

        platformAthlete,

        // =================================
        // EXISTING CONTRACT
        // =================================

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

        stateVersion:
            session.stateVersion ?? 0,

        integrity:
            session.integrity,

    };

};


export default getLiveCompetition;