const weighInValidator = (req, res, next) => {

    const {
        bodyWeight,
        lotNumber,
        selectedWeightCategory,
    } = req.body;

    const errors = [];

    // ===========================
    // Body Weight
    // ===========================

    if (
        bodyWeight === undefined ||
        bodyWeight === null ||
        Number.isNaN(Number(bodyWeight))
    ) {
        errors.push("Body weight is required.");
    } else if (Number(bodyWeight) <= 0) {
        errors.push("Body weight must be greater than zero.");
    }

    // ===========================
    // Lot Number
    // ===========================

    if (
        lotNumber === undefined ||
        lotNumber === null ||
        lotNumber === ""
    ) {
        errors.push("Lot number is required.");
    }

    // ===========================
    // Selected Weight Category
    // ===========================
    // Optional.
    // The service validates it only when
    // two eligible categories exist.

    if (
        selectedWeightCategory &&
        typeof selectedWeightCategory !== "string"
    ) {
        errors.push(
            "Selected weight category is invalid."
        );
    }

    // ===========================

    if (errors.length > 0) {

        return res.status(400).json({
            success: false,
            message: "Validation failed.",
            errors,
        });

    }

    next();

};

export default weighInValidator;