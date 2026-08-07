import CompetitionEntry from "../../models/CompetitionEntry.js";

const getCompetitionEntries = async (
    competitionId,
    gender = null,
    removeDuplicateAthletes = false
) => {

    const competitionEntries = await CompetitionEntry
        .find({ competitionId })
        .populate({
            path: "athleteId",
            select: "registrationNo personalInfo participations"
        });

    let filteredEntries = competitionEntries;

    if (gender) {
        filteredEntries = filteredEntries.filter(
            (entry) =>
                entry.athleteId?.personalInfo?.gender
                    ?.trim()
                    .toLowerCase() === gender.toLowerCase()
        );
    }

    filteredEntries.sort((a, b) => {

        const snatchA = a.opening?.snatch ?? 9999;
        const snatchB = b.opening?.snatch ?? 9999;

        if (snatchA !== snatchB) {
            return snatchA - snatchB;
        }

        return (
            (a.official?.lotNumber ?? 9999) -
            (b.official?.lotNumber ?? 9999)
        );

    });

    if (removeDuplicateAthletes) {

        const seen = new Set();

        filteredEntries = filteredEntries.filter((entry) => {

            const athleteId = entry.athleteId._id.toString();

            if (seen.has(athleteId)) {
                return false;
            }

            seen.add(athleteId);
            return true;

        });

    }

    return filteredEntries;
};

export default getCompetitionEntries;