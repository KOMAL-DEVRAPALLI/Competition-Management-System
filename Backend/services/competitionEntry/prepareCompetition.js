import Athlete from "../../models/Athlete.js";
import CompetitionEntry from "../../models/CompetitionEntry.js";
import mongoose from "mongoose";
const prepareCompetition = async (competitionId) => {

  const athletes = await Athlete.find({
    competition: new mongoose.Types.ObjectId(competitionId),
});
    let created = 0;
    let skipped = 0;

    for (const athlete of athletes) {

    for (const participation of athlete.participations) {

        const exists = await CompetitionEntry.findOne({
            competitionId,
            athleteId: athlete._id,
            "competitionCategory.ageCategory": participation.category,
        });

        if (exists) {
            skipped++;
            continue;
        }

        await CompetitionEntry.create({
            competitionId,
            athleteId: athlete._id,

            competitionCategory: {
                ageCategory: participation.category,
            },
        });

        created++;
    }
}
    return {
        created,
        skipped,
        total: athletes.length,
    };
};

export default prepareCompetition;