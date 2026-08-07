import getAthleteCompetitionEntries from "../competitionEntry/getAthleteCompetitionEntries.js"
import calculateEligibleWeightCategories from "../WeightCategory/calculateEligibleWeightCategories.js";

const previewAthleteWeighIn = async ({
    competitionId,
    athleteId,
    bodyWeight,
}) => {

    const competitionEntries =
        await getAthleteCompetitionEntries(
            competitionId,
            athleteId
        );

    const preview = [];

    for (const entry of competitionEntries) {

        const gender =
            entry.athleteId.personalInfo.gender;

        const ageCategory =
            entry.competitionCategory.ageCategory;

        const result =
            await calculateEligibleWeightCategories(
                gender,
                ageCategory,
                bodyWeight
            );

        preview.push({
            entryId: entry._id,
            ageCategory,
            eligibleCategories: result.eligibleCategories,
            requiresSelection: result.requiresSelection,
            assignedCategory: result.assignedCategory,
        });
    }

    return preview;
};

export default previewAthleteWeighIn;