import CompetitionEntry from "../../models/CompetitionEntry.js";
import updateCompetitionResults from "../calculations/updateCompetitionResults.js";

const updateSnatchAttempts = async (entryId, attempts) => {

    const competitionEntry = await CompetitionEntry.findById(entryId);

    if (!competitionEntry) {
        throw new Error("Competition entry not found.");
    }

    competitionEntry.snatchAttempts = attempts;

    await competitionEntry.save();

    await updateCompetitionResults(entryId);

    return await CompetitionEntry.findById(entryId);

};

export default updateSnatchAttempts;