import calculateBestSnatch from "./calculateBestSnatch.js";
import calculateBestCleanJerk from "./calculateBestCleanJerk.js";
import calculateTotal from "./calculateTotal.js";
import updateCategoryRanking from "./updateCategoryRanking.js";


// =====================================
// UPDATE COMPETITION RESULTS
//
// Responsibility:
//
// 1. Validate CompetitionEntry.
// 2. Calculate best Snatch from the
//    authoritative CompetitionEntry
//    attempt history.
// 3. Calculate best Clean & Jerk from the
//    authoritative CompetitionEntry
//    attempt history.
// 4. Determine whether the athlete has
//    completed all C&J attempts without
//    a successful lift.
// 5. Calculate Total.
// 6. Save calculated results to
//    CompetitionEntry.
// 7. Recalculate category ranking.
//
// IMPORTANT:
//
// CompetitionEntry is the authoritative
// source for:
// - attempt history
// - calculated live results
// - competition-entry state
//
// LiveCompetition is responsible for
// competition/session state only.
//
// =====================================
//
// TRANSACTION SUPPORT
//
// Normal:
//
// updateCompetitionResults(
//     competitionEntry
// )
//
// Transactional:
//
// updateCompetitionResults(
//     competitionEntry,
//     dbSession
// )
//
// =====================================


const updateCompetitionResults = async (
    competitionEntry,
    session = null
) => {

    // =====================================
    // VALIDATE COMPETITION ENTRY
    // =====================================

    if (!competitionEntry) {

        throw new Error(
            "Competition entry not found."
        );

    }


    // =====================================
    // VALIDATE ENTRY ID
    // =====================================

    if (!competitionEntry._id) {

        throw new Error(
            "Competition entry ID is missing."
        );

    }


    // =====================================
    // VALIDATE SNATCH ATTEMPT HISTORY
    // =====================================

    if (
        !Array.isArray(
            competitionEntry.snatchAttempts
        )
    ) {

        throw new Error(
            "Snatch attempt history is missing."
        );

    }


    // =====================================
    // VALIDATE CLEAN & JERK HISTORY
    // =====================================

    if (
        !Array.isArray(
            competitionEntry.cleanJerkAttempts
        )
    ) {

        throw new Error(
            "Clean & Jerk attempt history is missing."
        );

    }


    // =====================================
    // ENSURE RESULTS OBJECT EXISTS
    // =====================================

    if (
        !competitionEntry.results
    ) {

        competitionEntry.results = {

            bestSnatch: 0,

            bestCleanJerk: 0,

            total: 0,

            rank: null,

        };

    }


    // =====================================
    // CALCULATE BEST SNATCH
    //
    // SOURCE:
    //
    // CompetitionEntry.snatchAttempts
    // =====================================

    const bestSnatch =
        calculateBestSnatch(
            competitionEntry.snatchAttempts
        );


    // =====================================
    // CALCULATE BEST CLEAN & JERK
    //
    // SOURCE:
    //
    // CompetitionEntry.cleanJerkAttempts
    // =====================================

    const bestCleanJerk =
        calculateBestCleanJerk(
            competitionEntry.cleanJerkAttempts
        );


    // =====================================
    // DETERMINE CLEAN & JERK BOMB-OUT
    //
    // An athlete has completed the C&J
    // without a successful lift when all
    // three C&J attempts are NO_LIFT.
    //
    // IMPORTANT:
    //
    // Do NOT use bestCleanJerk === 0 alone
    // because an athlete may simply still
    // be in progress and have no successful
    // C&J yet.
    // =====================================

    const cleanJerkBombOut =
        competitionEntry.cleanJerkAttempts.length === 3 &&
        competitionEntry.cleanJerkAttempts.every(
            (attempt) =>
                attempt.result === "NO_LIFT"
        );


    // =====================================
    // CALCULATE TOTAL
    //
    // Normal:
    //
    // bestSnatch + bestCleanJerk
    //
    // C&J BOMB-OUT:
    //
    // No valid competition total.
    // Store total as 0 so the existing
    // ranking logic will not assign a rank.
    // =====================================

    const total =
        cleanJerkBombOut
            ? 0
            : calculateTotal(
                bestSnatch,
                bestCleanJerk
            );


    // =====================================
    // UPDATE RESULTS IN MEMORY
    // =====================================

    competitionEntry.results.bestSnatch =
        bestSnatch;


    competitionEntry.results.bestCleanJerk =
        bestCleanJerk;


    competitionEntry.results.total =
        total;


    // =====================================
    // C&J BOMB-OUT
    //
    // Explicitly clear any previous rank.
    //
    // This protects against an athlete
    // who previously had a calculated rank
    // before completing all three C&J lifts.
    // =====================================

    if (cleanJerkBombOut) {

        competitionEntry.results.rank =
            null;

    }


    // =====================================
    // SAVE CALCULATED RESULTS
    //
    // Results belong to CompetitionEntry.
    // =====================================

    if (session) {

        await competitionEntry.save({
            session,
        });

    } else {

        await competitionEntry.save();

    }


    // =====================================
    // UPDATE CATEGORY RANKING
    //
    // Ranking is recalculated from the
    // authoritative CompetitionEntry.
    //
    // Existing ranking logic only assigns
    // ranks where total > 0.
    //
    // Therefore a C&J bomb-out with total 0
    // receives rank null.
    // =====================================

    await updateCategoryRanking(
        competitionEntry,
        session
    );


    // =====================================
    // RETURN UPDATED ENTRY
    // =====================================

    return competitionEntry;

};


export default updateCompetitionResults;