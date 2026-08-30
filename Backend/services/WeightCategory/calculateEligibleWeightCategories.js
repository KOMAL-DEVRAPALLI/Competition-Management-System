import getWeightCategoryRule
    from "./WeightCategoryService.js";


const calculateEligibleWeightCategories = async (
    competitionId,
    gender,
    category,
    bodyWeight
) => {

    // =====================================
    // VALIDATE BODY WEIGHT
    // =====================================

    const numericBodyWeight =
        Number(bodyWeight);


    if (
        !Number.isFinite(
            numericBodyWeight
        ) ||
        numericBodyWeight <= 0
    ) {

        throw new Error(
            "Valid body weight is required."
        );

    }


    // =====================================
    // GET COMPETITION RULE
    // =====================================

    const {
        weights,
        tolerance,
    } =
        await getWeightCategoryRule(
            competitionId,
            gender,
            category
        );


    // =====================================
    // NORMALIZE CATEGORIES
    // =====================================

    const categories =
        weights
            .map((weight) => {

                const label =
                    String(weight).trim();

                return {

                    label,

                    limit:
                        label.startsWith("+")
                            ? null
                            : Number(label),

                    isPlus:
                        label.startsWith("+"),

                };

            })
            .filter(
                (category) =>
                    category.isPlus ||
                    Number.isFinite(
                        category.limit
                    )
            );


    const publishedCategories =
        categories.filter(
            (category) =>
                !category.isPlus
        );


    const plusCategory =
        categories.find(
            (category) =>
                category.isPlus
        );


    if (
        publishedCategories.length === 0 &&
        !plusCategory
    ) {

        throw new Error(
            "No valid weight categories configured."
        );

    }


    // =====================================
    // SORT NORMAL CATEGORIES
    // LOW → HIGH
    // =====================================

    publishedCategories.sort(
        (a, b) =>
            a.limit - b.limit
    );


    // =====================================
    // CALCULATE
    // =====================================

    for (
        let index = 0;
        index <
        publishedCategories.length;
        index++
    ) {

        const currentCategory =
            publishedCategories[index];


        const nextCategory =
            publishedCategories[
                index + 1
            ];


        // =================================
        // BODY WEIGHT IS INSIDE CATEGORY
        // =================================

        if (
            numericBodyWeight <=
            currentCategory.limit
        ) {

            return {

                eligibleCategories: [
                    currentCategory.label,
                ],

                requiresSelection:
                    false,

                assignedCategory:
                    currentCategory.label,

            };

        }


        // =================================
        // TOLERANCE ZONE
        // =================================

        if (
            numericBodyWeight >
                currentCategory.limit &&

            numericBodyWeight <=
                currentCategory.limit +
                tolerance
        ) {

            // =============================
            // HIGHEST CATEGORY
            // =============================

            if (!nextCategory) {

                if (!plusCategory) {

                    throw new Error(
                        "Highest weight category configuration is incomplete."
                    );

                }


                return {

                    eligibleCategories: [
                        currentCategory.label,
                        plusCategory.label,
                    ],

                    requiresSelection:
                        true,

                    assignedCategory:
                        null,

                };

            }


            // =============================
            // NORMAL ADJACENT CATEGORIES
            // =============================

            return {

                eligibleCategories: [
                    currentCategory.label,
                    nextCategory.label,
                ],

                requiresSelection:
                    true,

                assignedCategory:
                    null,

            };

        }

    }


    // =====================================
    // ABOVE ALL PUBLISHED CATEGORIES
    // =====================================

    if (plusCategory) {

        return {

            eligibleCategories: [
                plusCategory.label,
            ],

            requiresSelection:
                false,

            assignedCategory:
                plusCategory.label,

        };

    }


    throw new Error(
        "Unable to determine eligible weight category."
    );

};


export default calculateEligibleWeightCategories;