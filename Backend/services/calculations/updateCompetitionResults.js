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
// 4. Calculate Total.
// 5. Save calculated results to
//    CompetitionEntry.
// 6. Recalculate category ranking.
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
    // CALCULATE TOTAL
    // =====================================

    const total =
        calculateTotal(
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
    // SAVE CALCULATED RESULTS
    //
    // Results belong to CompetitionEntry.
    //
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
    // =====================================

    await updateCategoryRanking(
        competitionEntry._id,
        session
    );


    // =====================================
    // RETURN UPDATED ENTRY
    // =====================================

    return competitionEntry;

};


export default updateCompetitionResults;