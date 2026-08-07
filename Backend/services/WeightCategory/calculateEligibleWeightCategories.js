import getWeightCategoryRule from "./WeightCategoryService.js";

const calculateEligibleWeightCategories = async (
    gender,
    category,
    bodyWeight
) => {

    const {
        weights,
        tolerance,
    } = await getWeightCategoryRule(
        gender,
        category
    );

    const categories = weights.map((weight) => ({
        label: weight,
        limit: weight.startsWith("+")
            ? null
            : Number(weight),
        isPlus: weight.startsWith("+"),
    }));

    const publishedCategories = categories.filter(
        (category) => !category.isPlus
    );

    const plusCategory = categories.find(
        (category) => category.isPlus
    );

    for (let index = 0; index < publishedCategories.length; index++) {

        const currentCategory = publishedCategories[index];
        const nextCategory =
            publishedCategories[index + 1];

        const isHighestPublished =
            index === publishedCategories.length - 1;

        // Rule 1
        if (bodyWeight <= currentCategory.limit) {

            return {
                eligibleCategories: [
                    currentCategory.label,
                ],
                requiresSelection: false,
                assignedCategory:
                    currentCategory.label,
            };

        }

        // Rule 2
        if (
            bodyWeight >
                currentCategory.limit &&
            bodyWeight <=
                currentCategory.limit +
                    tolerance
        ) {

            if (isHighestPublished) {

                return {
                    eligibleCategories: [
                        currentCategory.label,
                        plusCategory.label,
                    ],
                    requiresSelection: true,
                    assignedCategory: null,
                };

            }

            return {
                eligibleCategories: [
                    currentCategory.label,
                    nextCategory.label,
                ],
                requiresSelection: true,
                assignedCategory: null,
            };

        }

    }

    if (plusCategory) {

        return {
            eligibleCategories: [
                plusCategory.label,
            ],
            requiresSelection: false,
            assignedCategory:
                plusCategory.label,
        };

    }

    throw new Error(
        "Unable to determine eligible weight category."
    );

};

export default calculateEligibleWeightCategories;