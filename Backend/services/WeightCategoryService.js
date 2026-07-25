import Competition from "../models/Competition.js"
const getWeightCategories = async (gender, category) => {
    const competition = await Competition.findOne({ status: "Registration Open" })
    if (!competition) {
        throw new Error("No competition is currently open.");
    }
    console.log(competition.weightCategories);
    const weightRule = competition.weightCategories.find(
        (item) =>
            item.gender === gender &&
            item.category === category
    );
    if (!weightRule) {
        throw new Error("Weight categories not found.");
    }
    return weightRule.weights
}
export default getWeightCategories