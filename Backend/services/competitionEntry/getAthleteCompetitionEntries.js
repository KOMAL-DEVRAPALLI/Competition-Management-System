import CompetitionEntry from "../../models/CompetitionEntry.js";

const getAthleteCompetitionEntries = async (
    competitionId,
    athleteId
) => {

    const competitionEntries =
        await CompetitionEntry.find({
            competitionId,
            athleteId,
        })
        .populate("athleteId")
        .populate("competitionId");

    if (competitionEntries.length === 0) {

        throw new Error(
            "Competition entries not found."
        );

    }

    return competitionEntries;

};

export default getAthleteCompetitionEntries;