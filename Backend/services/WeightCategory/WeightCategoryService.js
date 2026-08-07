import Competition from "../../models/Competition.js";

const getWeightCategoryRule = async (
    gender,
    category
) => {

    const competition = await Competition.findOne({
        status: "Registration Open",
    });

    if (!competition) {
        throw new Error(
            "No competition is currently open."
        );
    }

    const weightCategoryRule =
        competition.weightCategories.find(
            (item) =>
                item.gender === gender &&
                item.category === category
        );

    if (!weightCategoryRule) {
        throw new Error(
            "Weight categories not found."
        );
    }

    return {
        weights: weightCategoryRule.weights,
        tolerance: competition.rules.weighInTolerance,
    };

};

export default getWeightCategoryRule;