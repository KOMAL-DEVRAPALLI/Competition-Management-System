import Competition from "../models/Competition.js";

const calculateEligibility = async (dob) => {
    if (!dob) {
        throw new Error("Date of birth is required.")
    }
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const birthDate = new Date(dob)
    const birthYear = birthDate.getFullYear()
    const currentMonth = currentDate.getMonth();
    const birthMonth = birthDate.getMonth();
    const currentDay = currentDate.getDate();
    const birthDay = birthDate.getDate();

    let age = currentYear - birthYear

    if (
        currentMonth < birthMonth ||
        (currentMonth === birthMonth && currentDay < birthDay)
    ) {
        age--;
    }

const competition = await Competition.findOne({
    status: "Registration Open",
});

console.log("competition instanceof Document:", competition.constructor.name);
console.log("competition keys:", Object.keys(competition.toObject()));
console.log("competition.eligibilityRules =", competition.eligibilityRules);
console.log("competition.get('eligibilityRules') =", competition.get("eligibilityRules"));
console.log("competition.toObject() =", competition.toObject());

const rules = competition.eligibilityRules;

    const eligibleCategories = [];

    const youth = rules.youth
    const junior = rules.junior
    const senior = rules.senior
    if (
        birthYear >= youth.minBirthYear &&
        birthYear <= youth.maxBirthYear
    ) { eligibleCategories.push("Youth") }
    if (
        birthYear >= junior.minBirthYear &&
        birthYear <= junior.maxBirthYear
    ) { eligibleCategories.push("Junior") }
    if (birthYear <= senior.maxBirthYear) { eligibleCategories.push("Senior") }
    return {
        age, eligibleCategories ,competition
    }
}
export default calculateEligibility