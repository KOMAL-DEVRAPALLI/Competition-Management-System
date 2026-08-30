import mongoose from "mongoose";
import Competition from "../../models/Competition.js";

const getWeightCategoryRule = async (
    competitionId,
    gender,
    category
) => {

    // =====================================
    // VALIDATE COMPETITION ID
    // =====================================

    if (
        !competitionId ||
        !mongoose.Types.ObjectId.isValid(
            competitionId
        )
    ) {
        throw new Error(
            "Valid competition ID is required."
        );
    }


    // =====================================
    // LOAD ACTUAL COMPETITION
    // =====================================

    const competition =
        await Competition.findById(
            competitionId
        );


    if (!competition) {
        throw new Error(
            "Competition not found."
        );
    }


    // =====================================
    // FIND GENDER + AGE CATEGORY
    // =====================================

    const weightCategoryRule =
        competition.weightCategories?.find(
            (item) =>
                String(item.gender).trim().toLowerCase() ===
                    String(gender).trim().toLowerCase() &&

                String(item.category).trim().toLowerCase() ===
                    String(category).trim().toLowerCase()
        );


    if (!weightCategoryRule) {

        throw new Error(
            `Weight categories not found for ${gender} ${category}.`
        );

    }


    // =====================================
    // VALIDATE WEIGHT DATA
    // =====================================

    if (
        !Array.isArray(
            weightCategoryRule.weights
        ) ||
        weightCategoryRule.weights.length === 0
    ) {

        throw new Error(
            `Weight category configuration is empty for ${gender} ${category}.`
        );

    }


    // =====================================
    // WEIGH-IN TOLERANCE
    // =====================================

    const tolerance =
        Number(
            competition.rules?.weighInTolerance
        ) || 0.250;


    return {

        weights:
            weightCategoryRule.weights,

        tolerance,

    };

};


export default getWeightCategoryRule;