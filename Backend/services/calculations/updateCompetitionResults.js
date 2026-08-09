import calculateBestSnatch from "./calculateBestSnatch.js";
import calculateBestCleanJerk from "./calculateBestCleanJerk.js";
import calculateTotal from "./calculateTotal.js";
import updateCategoryRanking from "./updateCategoryRanking.js";

const updateCompetitionResults = async (
    competitionEntry
) => {

    // =====================================
    // VALIDATE ENTRY
    // =====================================

    if (!competitionEntry) {
        throw new Error(
            "Competition entry not found."
        );
    }


    // =====================================
    // ENSURE RESULTS OBJECT EXISTS
    //
    // Important for older CompetitionEntry
    // documents that were created before the
    // results field existed.
    // =====================================

    if (!competitionEntry.results) {

        competitionEntry.results = {

            bestSnatch: 0,

            bestCleanJerk: 0,

            total: 0,

            rank: null,

        };

    }


    // =====================================
    // CALCULATE BEST SNATCH
    // =====================================

    const bestSnatch =
        calculateBestSnatch(
            competitionEntry.snatchAttempts
        );


    // =====================================
    // CALCULATE BEST CLEAN & JERK
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
    // SAVE ENTRY
    // =====================================

    await competitionEntry.save();


    // =====================================
    // UPDATE CATEGORY RANKING
    // =====================================

    await updateCategoryRanking(
        competitionEntry._id
    );


    // =====================================
    // RETURN UPDATED ENTRY
    // =====================================

    return competitionEntry;
};


export default updateCompetitionResults;