import CompetitionEntry from "../../models/CompetitionEntry.js";
import calculateEligibleWeightCategories from "../WeightCategory/calculateEligibleWeightCategories.js";

const getEligibleWeightCategories = async (
    entryId,
    bodyWeight
) => {

    const competitionEntry = await CompetitionEntry.findById(entryId)
        .populate("athleteId");

    if (!competitionEntry) {
        throw new Error("Competition entry not found.");
    }

    const gender =
        competitionEntry.athleteId.personalInfo.gender;

    const ageCategory =
        competitionEntry.competitionCategory.ageCategory;

    const result =
        await calculateEligibleWeightCategories(
            gender,
            ageCategory,
            bodyWeight
        );

    return result;

};

export default getEligibleWeightCategories;