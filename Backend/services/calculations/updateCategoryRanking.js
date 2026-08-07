import CompetitionEntry from "../../models/CompetitionEntry.js";

const updateCategoryRanking = async (entryId) => {

    const currentEntry = await CompetitionEntry.findById(entryId);

    if (!currentEntry) {
        throw new Error("Competition entry not found.");
    }

    const entries = await CompetitionEntry.find({
        competitionId: currentEntry.competitionId,
        "official.finalWeightCategory":
            currentEntry.official.finalWeightCategory,
    });

    entries.sort((a, b) => {

        if (a.results.total !== b.results.total) {
            return b.results.total - a.results.total;
        }

        if (
            a.results.bestCleanJerk !==
            b.results.bestCleanJerk
        ) {
            return (
                b.results.bestCleanJerk -
                a.results.bestCleanJerk
            );
        }

        if (
            a.results.bestSnatch !==
            b.results.bestSnatch
        ) {
            return (
                b.results.bestSnatch -
                a.results.bestSnatch
            );
        }

        return (
            (a.official.bodyWeight ?? 999) -
            (b.official.bodyWeight ?? 999)
        );

    });

    let currentRank = 1;

    for (const entry of entries) {

        if (entry.results.total > 0) {

            entry.results.rank = currentRank;
            currentRank++;

        } else {

            entry.results.rank = null;

        }

        await entry.save();

    }

};

export default updateCategoryRanking;