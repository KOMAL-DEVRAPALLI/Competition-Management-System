import CompetitionEntry from "../../models/CompetitionEntry.js";
import calculateEligibleWeightCategories from "../WeightCategory/calculateEligibleWeightCategories.js";

const getEligibleWeightCategories = async (
    entryId,
    bodyWeight
) => {

    // =====================================
    // LOAD COMPETITION ENTRY
    // =====================================

    const competitionEntry =
        await CompetitionEntry.findById(entryId)
            .populate("athleteId");

    if (!competitionEntry) {

        throw new Error(
            "Competition entry not found."
        );

    }


    // =====================================
    // GET COMPETITION ID
    // =====================================

    const competitionId =
        competitionEntry.competitionId;

    if (!competitionId) {

        throw new Error(
            "Competition ID is missing from competition entry."
        );

    }


    // =====================================
    // GET ATHLETE GENDER
    // =====================================

    const gender =
        competitionEntry
            .athleteId
            ?.personalInfo
            ?.gender;

    if (!gender) {

        throw new Error(
            "Athlete gender is missing."
        );

    }


    // =====================================
    // GET COMPETITION AGE CATEGORY
    // =====================================

    const ageCategory =
        competitionEntry
            .competitionCategory
            ?.ageCategory;

    if (!ageCategory) {

        throw new Error(
            "Competition age category is missing."
        );

    }


    // =====================================
    // DEBUG
    // =====================================

    console.log(
        "Calculating eligible weight categories:",
        {
            competitionId:
                String(competitionId),

            gender,

            ageCategory,

            bodyWeight,
        }
    );


    // =====================================
    // CALCULATE
    //
    // IMPORTANT:
    // Argument order MUST match:
    //
    // calculateEligibleWeightCategories(
    //     competitionId,
    //     gender,
    //     category,
    //     bodyWeight
    // )
    // =====================================

    const result =
        await calculateEligibleWeightCategories(
            String(competitionId),
            gender,
            ageCategory,
            bodyWeight
        );


    // =====================================
    // RETURN RESULT
    // =====================================

    return result;

};


export default getEligibleWeightCategories;