import Competition from "../../models/Competition.js";

const calculateEligibility = async (dob) => {
    if (!dob) {
        throw new Error("Date of birth is required.");
    }

    const competition = await Competition.findOne({
        status: "Registration Open",
    });

    if (!competition) {
        throw new Error("No competition is currently open for registration.");
    }

    const birthDate = new Date(dob);
    const birthYear = birthDate.getFullYear();

    // Age is calculated using the competition year
    const age = competition.year - birthYear;

    const rules = competition.eligibilityRules;

    const eligibleCategories = [];

    const youth = rules.youth;
    const junior = rules.junior;
    const senior = rules.senior;

    if (
        birthYear >= youth.minBirthYear &&
        birthYear <= youth.maxBirthYear
    ) {
        eligibleCategories.push("Youth");
    }

    if (
        birthYear >= junior.minBirthYear &&
        birthYear <= junior.maxBirthYear
    ) {
        eligibleCategories.push("Junior");
    }

    if (birthYear <= senior.maxBirthYear) {
        eligibleCategories.push("Senior");
    }

    return {
        age,
        eligibleCategories,
        competition,
    };
};

export default calculateEligibility;