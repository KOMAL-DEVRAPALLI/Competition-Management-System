import Athlete from "../../models/Athlete.js";
import CompetitionEntry from "../../models/CompetitionEntry.js";
import mongoose from "mongoose";

const prepareCompetition = async (competitionId) => {

    const athletes = await Athlete.find({
        competition: new mongoose.Types.ObjectId(
            competitionId
        ),
    });

    let created = 0;
    let skipped = 0;

    for (const athlete of athletes) {

        // Remove duplicate categories if they exist
        const uniqueCategories = [
            ...new Set(
                athlete.participations.map(
                    (participation) =>
                        participation.category
                )
            ),
        ];

        for (const category of uniqueCategories) {

            console.log(
                "Preparing:",
                athlete.personalInfo.fullName,
                "-",
                category
            );

            const result =
                await CompetitionEntry.updateOne(
                    {
                        competitionId,
                        athleteId: athlete._id,
                        "competitionCategory.ageCategory":
                            category,
                    },
                    {
                        $setOnInsert: {
                            competitionId,
                            athleteId: athlete._id,
                            competitionCategory: {
                                ageCategory: category,
                            },
                        },
                    },
                    {
                        upsert: true,
                    }
                );

            if (result.upsertedCount > 0) {

                created++;

                console.log("Created");

            } else {

                skipped++;

                console.log("Already exists");

            }

        }

    }

    return {

        created,

        skipped,

        total: athletes.length,

    };

};

export default prepareCompetition;