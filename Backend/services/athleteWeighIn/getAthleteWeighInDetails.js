import CompetitionEntry from "../../models/CompetitionEntry.js"

const getAthleteWeighInDetails = async ({ competitionId, athleteId }) => {
    const competitionEntries = await CompetitionEntry.find({
        competitionId,
        athleteId,
    }).populate("athleteId")
    if (competitionEntries.length === 0) {
        throw new Error("Competition entries not found.");
    }
  const competitionEntriesWithoutAthlete  =  competitionEntries.map((entry) => {

        const entryObject = entry.toObject();
            const { athleteId, ...rest } = entryObject;
            return rest
    });
    return{
        athlete:{
            ...competitionEntries[0].athleteId.toObject(),
            competitionEntries : competitionEntriesWithoutAthlete 
        }
    }
}
export default getAthleteWeighInDetails