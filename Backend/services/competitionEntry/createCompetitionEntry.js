import CompetitionEntry from "../../models/CompetitionEntry.js";

const createCompetitionEntry = async ({
    competitionId,
    athleteId,
}) => {

    const existingEntry = await CompetitionEntry.findOne({
        competitionId,
        athleteId,
    });

    if (existingEntry) {
        throw new Error("Competition entry already exists.");
    }

    const competitionEntry = await CompetitionEntry.create({
        competitionId,
        athleteId,
    });

    return competitionEntry;
};

export default createCompetitionEntry;