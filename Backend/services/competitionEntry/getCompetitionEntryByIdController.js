import CompetitionEntry from "../../models/CompetitionEntry.js";

const getCompetitionEntryById = async (id) => {

    const competitionEntry = await CompetitionEntry
        .findById(id)
        .populate("athleteId")
        .populate("competitionId");

    if (!competitionEntry) {
        throw new Error("Competition Entry not found.");
    }

    return competitionEntry;
};

export default getCompetitionEntryById;