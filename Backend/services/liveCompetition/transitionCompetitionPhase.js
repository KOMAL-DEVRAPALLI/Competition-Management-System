import LiveCompetition from "../../models/LiveCompetition.js";
import Competition from "../../models/Competition.js";
import CompetitionEntry from "../../models/CompetitionEntry.js";


// =====================================
// FEATURE 3.7D
// COMPETITION PHASE TRANSITION
//
// Responsibility:
//
// 1. Read authoritative live session.
// 2. Validate recovery/integrity state.
// 3. Determine whether SNATCH is exhausted.
// 4. Determine whether any in-scope athlete
//    may continue into CLEAN & JERK.
// 5. Transition:
//
//       SNATCH
//          ↓
//       CLEAN_JERK
//
//    OR:
//
//       SNATCH
//          ↓
//       COMPLETED
//
// 6. Transition CLEAN_JERK → COMPLETED
//    when C&J is exhausted.
//
// IMPORTANT:
//
// This service does NOT:
//
// - determine calling order
// - select next athlete
// - process Good Lift / No Lift
// - modify athlete attempts
// - modify declarations
//
// Calling order belongs to Feature 3.2.
// Candidate eligibility belongs to Feature 3.1.
//
// =====================================
//
// LOCKED COMPETITION FORMAT
//
// TOTAL_ONLY:
//   Three failed Snatches exclude the
//   athlete from C&J.
//
// SEPARATE_LIFT_CLASSIFICATION:
//   Three failed Snatches do NOT by
//   themselves exclude the athlete from C&J.
//
// Missing format:
//   Automatic transition stops.
//
// No default is applied.
//
// =====================================
//
// STATE VERSION OWNERSHIP
//
// Normal lift-result flow:
//
// processLift()
//      ↓
// advanceCompetition()
//      ↓
// transitionCompetitionPhase({
//     incrementStateVersion: false
// })
//
// processLift() owns the final stateVersion
// increment for that accepted lift action.
//
// Direct phase-transition calls may use the
// default:
//
// incrementStateVersion = true
//
// =====================================


const VALID_FORMATS = [
    "TOTAL_ONLY",
    "SEPARATE_LIFT_CLASSIFICATION",
];


// =====================================
// ERROR HELPER
// =====================================

const createError = (
    message,
    code,
    statusCode = 409
) => {

    const error =
        new Error(message);

    error.code =
        code;

    error.statusCode =
        statusCode;

    return error;

};


// =====================================
// NORMALIZE GENDER
// =====================================

const normalizeGender = (
    gender
) => {

    return String(
        gender ?? ""
    )
        .trim()
        .toLowerCase();

};


// =====================================
// NORMALIZE CATEGORY
// =====================================

const normalizeCategory = (
    category
) => {

    return String(
        category ?? ""
    )
        .trim();

};


// =====================================
// CHECK THREE FAILED SNATCHES
// =====================================

const hasThreeFailedSnatches = (
    competitionEntry
) => {

    const attempts =
        competitionEntry?.snatchAttempts;


    if (!Array.isArray(attempts)) {

        throw createError(
            "Snatch attempt history is missing.",
            "QUEUE_INTEGRITY_ERROR"
        );

    }


    const firstThreeAttempts =
        attempts.filter(
            (attempt) =>
                Number.isInteger(
                    attempt?.attemptNo
                ) &&
                attempt.attemptNo >= 1 &&
                attempt.attemptNo <= 3
        );


    if (
        firstThreeAttempts.length !== 3
    ) {

        throw createError(
            "Authoritative Snatch attempt history is incomplete.",
            "QUEUE_INTEGRITY_ERROR"
        );

    }


    return firstThreeAttempts.every(
        (attempt) =>
            attempt.result ===
            "NO_LIFT"
    );

};


// =====================================
// CHECK PENDING C&J ATTEMPT
// =====================================

const hasPendingCleanJerkAttempt = (
    competitionEntry
) => {

    const attempts =
        competitionEntry?.cleanJerkAttempts;


    if (!Array.isArray(attempts)) {

        throw createError(
            "Clean & Jerk attempt history is missing.",
            "QUEUE_INTEGRITY_ERROR"
        );

    }


    const firstThreeAttempts =
        attempts.filter(
            (attempt) =>
                Number.isInteger(
                    attempt?.attemptNo
                ) &&
                attempt.attemptNo >= 1 &&
                attempt.attemptNo <= 3
        );


    if (
        firstThreeAttempts.length !== 3
    ) {

        throw createError(
            "Authoritative Clean & Jerk attempt history is incomplete.",
            "QUEUE_INTEGRITY_ERROR"
        );

    }


    return firstThreeAttempts.some(
        (attempt) =>
            attempt.result ===
            "PENDING"
    );

};


// =====================================
// C&J PHASE ELIGIBILITY
//
// This answers only:
//
// "Can this athlete contribute to the
// C&J phase?"
//
// It does NOT determine calling order.
// =====================================

const isCleanJerkEligible = ({
    competitionEntry,
    competitionFormat,
}) => {

    if (
        !VALID_FORMATS.includes(
            competitionFormat
        )
    ) {

        throw createError(
            "Competition format must be explicitly established before automatic phase transition.",
            "COMPETITION_FORMAT_REQUIRED"
        );

    }


    // ---------------------------------
    // TOTAL_ONLY
    //
    // Three failed Snatches eliminate
    // the athlete from C&J.
    // ---------------------------------

    if (
        competitionFormat ===
        "TOTAL_ONLY"
    ) {

        if (
            hasThreeFailedSnatches(
                competitionEntry
            )
        ) {

            return false;

        }

    }


    // ---------------------------------
    // SEPARATE_LIFT_CLASSIFICATION
    //
    // Three failed Snatches do not by
    // themselves eliminate C&J.
    // ---------------------------------

    return hasPendingCleanJerkAttempt(
        competitionEntry
    );

};


// =====================================
// CHECK SNATCH EXHAUSTION
//
// Snatch is exhausted only when every
// in-scope athlete has completed all
// three Snatch attempts.
//
// =====================================

const isSnatchExhausted = (
    entries
) => {

    if (!Array.isArray(entries)) {

        throw createError(
            "Competition entries are missing.",
            "QUEUE_INTEGRITY_ERROR"
        );

    }


    for (const entry of entries) {

        const attempts =
            entry.snatchAttempts;


        if (!Array.isArray(attempts)) {

            throw createError(
                "Snatch attempt history is missing.",
                "QUEUE_INTEGRITY_ERROR"
            );

        }


        const firstThreeAttempts =
            attempts.filter(
                (attempt) =>
                    Number.isInteger(
                        attempt?.attemptNo
                    ) &&
                    attempt.attemptNo >= 1 &&
                    attempt.attemptNo <= 3
            );


        if (
            firstThreeAttempts.length !== 3
        ) {

            throw createError(
                "Authoritative Snatch attempt history is incomplete.",
                "QUEUE_INTEGRITY_ERROR"
            );

        }


        const hasPendingAttempt =
            firstThreeAttempts.some(
                (attempt) =>
                    attempt.result ===
                    "PENDING"
            );


        if (
            hasPendingAttempt
        ) {

            return false;

        }

    }


    return true;

};


// =====================================
// LOAD SESSION-SCOPED ENTRIES
//
// Empty selectedWeightCategories means
// ALL categories.
// =====================================

const loadCompetitionEntries = async ({
    competitionId,
    selectedWeightCategories,
    dbSession = null,
}) => {

    let query =
        CompetitionEntry
            .find({
                competitionId,
            })
            .select(
                [
                    "_id",
                    "official.finalWeightCategory",
                    "snatchAttempts",
                    "cleanJerkAttempts",
                ].join(" ")
            );


    if (dbSession) {

        query =
            query.session(
                dbSession
            );

    }


    const entries =
        await query.lean();


    const normalizedCategories =
        Array.isArray(
            selectedWeightCategories
        )
            ? selectedWeightCategories
                .map(
                    normalizeCategory
                )
                .filter(Boolean)
            : [];


    // =====================================
    // EMPTY CATEGORY ARRAY = ALL CATEGORIES
    // =====================================

    if (
        normalizedCategories.length === 0
    ) {

        return entries;

    }


    // =====================================
    // FILTER SELECTED CATEGORIES
    // =====================================

    return entries.filter(
        (entry) => {

            const category =
                normalizeCategory(
                    entry.official
                        ?.finalWeightCategory
                );


            return normalizedCategories
                .includes(category);

        }
    );

};


// =====================================
// LOAD AUTHORITATIVE COMPETITION
// =====================================

const loadCompetition = async ({
    competitionId,
    dbSession = null,
}) => {

    let query =
        Competition.findById(
            competitionId
        );


    if (dbSession) {

        query =
            query.session(
                dbSession
            );

    }


    return query.lean();

};


// =====================================
// CHECK C&J EXHAUSTION
// =====================================

const isCleanJerkExhausted = (
    entries,
    competitionFormat
) => {

    for (const entry of entries) {

        if (
            isCleanJerkEligible({

                competitionEntry:
                    entry,

                competitionFormat,

            })
        ) {

            return false;

        }

    }


    return true;

};


// =====================================
// MAIN TRANSITION SERVICE
//
// Phase state machine:
//
// SNATCH
//   ↓
// CLEAN_JERK
//   ↓
// COMPLETED
//
// =====================================

const transitionCompetitionPhase = async ({
    competitionId,
    gender,
    dbSession = null,
    liveSession = null,
    incrementStateVersion = true,
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
        normalizeGender(
            gender
        );


    // =====================================
    // VALIDATE STATE VERSION OPTION
    // =====================================

    if (
        typeof incrementStateVersion !==
        "boolean"
    ) {

        throw createError(
            "incrementStateVersion must be a boolean.",
            "QUEUE_INTEGRITY_ERROR"
        );

    }


    // =====================================
    // LOAD AUTHORITATIVE LIVE SESSION
    // =====================================

    let session =
        liveSession;


    if (!session) {

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


        session =
            await sessionQuery;

    }


    if (!session) {

        throw createError(
            "Live competition session not found.",
            "LIVE_SESSION_NOT_FOUND",
            404
        );

    }


    // =====================================
    // RECOVERY SAFETY
    // =====================================

    if (
        session.status ===
        "RECOVERY_REQUIRED"
    ) {

        throw createError(
            "Live competition requires recovery. Automatic phase transition is stopped.",
            "RECOVERY_REQUIRED"
        );

    }


    if (
        session.integrity?.status ===
        "RECOVERY_REQUIRED"
    ) {

        throw createError(
            "Live competition integrity requires recovery. Automatic phase transition is stopped.",
            "QUEUE_INTEGRITY_ERROR"
        );

    }


    // =====================================
    // COMPLETED IS IDEMPOTENT
    // =====================================

    if (
        session.currentPhase ===
        "COMPLETED"
    ) {

        return session;

    }


    // =====================================
    // ONLY THESE PHASES ARE VALID
    //
    // BREAK is intentionally NOT valid.
    // =====================================

    if (
        session.currentPhase !==
            "SNATCH" &&
        session.currentPhase !==
            "CLEAN_JERK"
    ) {

        throw createError(
            `Invalid live competition phase: ${session.currentPhase}`,
            "INVALID_COMPETITION_PHASE"
        );

    }


    // =====================================
    // LOAD AUTHORITATIVE COMPETITION
    // =====================================

    const competition =
        await loadCompetition({

            competitionId,

            dbSession,

        });


    if (!competition) {

        throw createError(
            "Competition not found.",
            "COMPETITION_NOT_FOUND",
            404
        );

    }


    // =====================================
    // COMPETITION FORMAT
    // =====================================

    const competitionFormat =
        competition.competitionFormat;


    if (
        !VALID_FORMATS.includes(
            competitionFormat
        )
    ) {

        throw createError(
            "Competition format must be explicitly established before automatic phase transition.",
            "COMPETITION_FORMAT_REQUIRED"
        );

    }


    // =====================================
    // LOAD SESSION-SCOPED ENTRIES
    // =====================================

    const entries =
        await loadCompetitionEntries({

            competitionId,

            selectedWeightCategories:
                session.selectedWeightCategories,

            dbSession,

        });


    // =====================================
    // SNATCH PHASE
    // =====================================

    if (
        session.currentPhase ===
        "SNATCH"
    ) {

        const snatchExhausted =
            isSnatchExhausted(
                entries
            );


        // ---------------------------------
        // Snatch still active.
        // ---------------------------------

        if (!snatchExhausted) {

            return session;

        }


        // ---------------------------------
        // Determine whether any athlete
        // can continue to C&J.
        // ---------------------------------

        let cleanJerkEligible =
            false;


        for (const entry of entries) {

            if (
                isCleanJerkEligible({

                    competitionEntry:
                        entry,

                    competitionFormat,

                })
            ) {

                cleanJerkEligible =
                    true;

                break;

            }

        }


        // ---------------------------------
        // No C&J-eligible athlete.
        //
        // SNATCH → COMPLETED
        // ---------------------------------

        if (!cleanJerkEligible) {

            session.currentPhase =
                "COMPLETED";

            session.currentEntryId =
                null;

            session.prepareEntryId =
                null;

            session.status =
                "FINISHED";


            if (
                incrementStateVersion
            ) {

                session.stateVersion =
                    Number(
                        session.stateVersion ?? 0
                    ) + 1;

            }


            await session.save({

                session:
                    dbSession ?? undefined,

            });


            return session;

        }


        // ---------------------------------
        // C&J athlete exists.
        //
        // SNATCH → CLEAN_JERK
        // ---------------------------------

        session.currentPhase =
            "CLEAN_JERK";

        session.currentEntryId =
            null;

        session.prepareEntryId =
            null;


        if (
            incrementStateVersion
        ) {

            session.stateVersion =
                Number(
                    session.stateVersion ?? 0
                ) + 1;

        }


        await session.save({

            session:
                dbSession ?? undefined,

        });


        return session;

    }


    // =====================================
    // CLEAN & JERK PHASE
    // =====================================

    if (
        session.currentPhase ===
        "CLEAN_JERK"
    ) {

        const cleanJerkExhausted =
            isCleanJerkExhausted(

                entries,

                competitionFormat,

            );


        // ---------------------------------
        // C&J still active.
        // ---------------------------------

        if (
            !cleanJerkExhausted
        ) {

            return session;

        }


        // ---------------------------------
        // C&J exhausted.
        //
        // CLEAN_JERK → COMPLETED
        // ---------------------------------

        session.currentPhase =
            "COMPLETED";

        session.currentEntryId =
            null;

        session.prepareEntryId =
            null;

        session.status =
            "FINISHED";


        if (
            incrementStateVersion
        ) {

            session.stateVersion =
                Number(
                    session.stateVersion ?? 0
                ) + 1;

        }


        await session.save({

            session:
                dbSession ?? undefined,

        });


        return session;

    }


    // =====================================
    // INVALID PHASE
    // =====================================

    throw createError(
        `Invalid live competition phase: ${session.currentPhase}`,
        "INVALID_COMPETITION_PHASE"
    );

};


// =====================================
// NAMED EXPORTS
// =====================================

export {
    hasThreeFailedSnatches,
    hasPendingCleanJerkAttempt,
    isCleanJerkEligible,
    isSnatchExhausted,
    isCleanJerkExhausted,
};


// =====================================

export default transitionCompetitionPhase;