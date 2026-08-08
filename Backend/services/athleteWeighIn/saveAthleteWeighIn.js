import getAthleteCompetitionEntries from "../competitionEntry/getAthleteCompetitionEntries.js";
import getAthleteWeighInDetails from "./getAthleteWeighInDetails.js";

const saveAthleteWeighIn = async ({
    competitionId,
    athleteId,
    bodyWeight,
    lotNumber,
    selectedCategories,
}) => {


    const competitionEntries = await getAthleteCompetitionEntries(
        competitionId,
        athleteId
    );
console.log("Recieved:" ,selectedCategories);

    for (const entry of competitionEntries) {

        const finalWeightCategory =
            selectedCategories[String(entry._id)];

        if (!finalWeightCategory) {
            throw new Error(
                `Final weight category is not found for ${entry.competitionCategory.ageCategory}`
            );
        }

        entry.official.bodyWeight = bodyWeight;
        entry.official.lotNumber = lotNumber;
        entry.official.finalWeightCategory = finalWeightCategory;
        entry.status = "WEIGHED";

        await entry.save();
    }

    const result = await getAthleteWeighInDetails({
        competitionId,
        athleteId,
    });

    return result;
};

export default saveAthleteWeighIn;