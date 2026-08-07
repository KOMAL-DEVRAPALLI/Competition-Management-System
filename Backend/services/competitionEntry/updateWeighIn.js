import CompetitionEntry from "../../models/CompetitionEntry.js";
import calculateEligibleWeightCategories from "../WeightCategory/calculateEligibleWeightCategories.js";

const updateWeighIn = async (entryId, officialData,adminId=null) => {

    const competitionEntry = await CompetitionEntry.findById(entryId)
        .populate("athleteId");

    if (!competitionEntry) {
        throw new Error("Competition entry not found.");
    }
    const gender = competitionEntry.athleteId.personalInfo.gender;

    const ageCategory =
        competitionEntry.competitionCategory.ageCategory;

   const result =
    await calculateEligibleWeightCategories(
        gender,
        ageCategory,
        officialData.bodyWeight
    );


      competitionEntry.official.bodyWeight =
        officialData.bodyWeight;

    competitionEntry.official.lotNumber =
        officialData.lotNumber;

    competitionEntry.official.eligibleWeightCategories =
        result.eligibleCategories;
         if (!result.requiresSelection) {

        competitionEntry.official.selectedWeightCategory =
            result.assignedCategory;

        competitionEntry.official.finalWeightCategory =
            result.assignedCategory;

    } 
    else{
        const seletedCategory = officialData.selectedWeightCategory

        if(!seletedCategory || !result.eligibleCategories.includes(seletedCategory)){
            throw new Error ("Invalid weight category selected.")
        }
        competitionEntry.official.selectedWeightCategory=seletedCategory
        competitionEntry.official.finalWeightCategory = seletedCategory
    }
    competitionEntry.official.weighInCompletedAt = new Date()
    competitionEntry.official.weighedBy = adminId
    
    await competitionEntry.save();

    return competitionEntry;
};

export default updateWeighIn;