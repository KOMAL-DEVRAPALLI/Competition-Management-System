import CompetitionEntry from "../../models/CompetitionEntry.js";

const getCompetitionEntry = async (
    competitionId,
    athleteId
) => {

    const competitionEntry =
        await CompetitionEntry.findOne({
            competitionId,
            athleteId,
        })
        .populate("athleteId")
        .populate("competitionId");

    if (!competitionEntry) {
        throw new Error("Competition entry not found.");
    }

    return competitionEntry;
};

export default getCompetitionEntry;