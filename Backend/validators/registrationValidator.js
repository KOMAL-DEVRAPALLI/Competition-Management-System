const registrationValidator = (req, res, next) => {
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);

    const {
        fullName,
        gender,
        dob,
        phone,
        email,
        address,
        club,
        coach,
        coachPhone,
        participations = [],
    } = req.body;

    const errors = [];
    const validCategories = ["Youth", "Junior", "Senior"];

    // ===========================
    // Required Field Validation
    // ===========================

    if (!fullName?.trim()) {
        errors.push("Full name is required.");
    }

    if (!gender?.trim()) {
        errors.push("Gender is required.");
    }

    if (!dob || isNaN(Date.parse(dob))) {
        errors.push("A valid date of birth is required.");
    }

    if (!phone?.trim()) {
        errors.push("Phone number is required.");
    }

    if (!email?.trim()) {
        errors.push("Email is required.");
    }

    if (!address?.trim()) {
        errors.push("Address is required.");
    }

    // Uncomment these when Club/Coach fields are enabled in Version 2

    /*
    if (!club?.trim()) {
        errors.push("Club is required.");
    }

    if (!coach?.trim()) {
        errors.push("Coach name is required.");
    }

    if (!coachPhone?.trim()) {
        errors.push("Coach phone number is required.");
    }
    */

    // ===========================
    // Phone Validation
    // ===========================

    const normalizePhone = (number) => {
        return number
            ?.replace(/\s+/g, "")
            .replace(/^\+91/, "");
    };

    const normalizedPhone = normalizePhone(phone);
    const normalizedCoachPhone = normalizePhone(coachPhone);

    const phoneRegex = /^[6-9]\d{9}$/;

    if (phone?.trim() && !phoneRegex.test(normalizedPhone)) {
        errors.push(
            "Phone number must be a valid 10-digit Indian mobile number."
        );
    }

    if (
        coachPhone?.trim() &&
        !phoneRegex.test(normalizedCoachPhone)
    ) {
        errors.push(
            "Coach phone number must be a valid 10-digit Indian mobile number."
        );
    }

    // ===========================
    // Email Validation
    // ===========================

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = email?.trim();

    if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
        errors.push("Email format is invalid.");
    }

    // ===========================
    // Participation Validation
    // ===========================

    if (!Array.isArray(participations) || participations.length === 0) {
        errors.push("Please select at least one age category.");
    } else {
        participations.forEach((participation, index) => {
            if (!participation.category?.trim()) {
                errors.push(
                    `Participation ${index + 1}: Age category is required.`
                );
            }

            if (
                participation.category &&
                !validCategories.includes(participation.category)
            ) {
                errors.push(
                    `Participation ${index + 1}: Invalid age category.`
                );
            }

            // ===========================
            // Version 2
            // ===========================
            /*
            if (!participation.weightCategory?.trim()) {
                errors.push(
                    `Participation ${index + 1}: Weight category is required.`
                );
            }
            */
        });
    }

    // ===========================
    // Return Validation Errors
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

export default registrationValidator;