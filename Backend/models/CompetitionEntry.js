import CompetitionEntry from "../../models/CompetitionEntry.js";

import calculateBestSnatch from "./calculateBestSnatch.js";
import calculateBestCleanJerk from "./calculateBestCleanCleanJerk.js";
import calculateTotal from "./calculateTotal.js";
import updateCategoryRanking from "./updateCategoryRanking.js";

const updateCompetitionResults = async (entryId) => {

    const entry = await CompetitionEntry.findById(
        entryId
    );

    if (!entry) {
        throw new Error(
            "Competition entry not found."
        );
    }

    const bestSnatch =
        calculateBestSnatch(
            entry.snatchAttempts
        );

    const bestCleanJerk =
        calculateBestCleanJerk(
            entry.cleanJerkAttempts
        );

    const total =
        calculateTotal(
            bestSnatch,
            bestCleanJerk
        );

    entry.results.bestSnatch =
        bestSnatch;

    entry.results.bestCleanJerk =
        bestCleanJerk;

    entry.results.total =
        total;

    /*
     * Save the calculated competition results.
     */
    await entry.save();

    /*
     * Recalculate ranking for the
     * athlete's final weight category.
     */
    await updateCategoryRanking(
        entryId
    );

    /*
     * Return the updated entry.
     */
    return entry;
};

export default updateCompetitionResults;