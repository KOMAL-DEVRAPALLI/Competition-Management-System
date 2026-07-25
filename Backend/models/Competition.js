import mongoose from "mongoose";

const competitionSchema = new mongoose.Schema({
    competitionName: String,
    registrationPrefix: String,
    year: Number,
    venue: String,
    startDate: Date,
    endDate: Date,
    registrationStart: Date,
    registrationEnd: Date,

    eligibilityRules: {
        youth: {
            minBirthYear: Number,
            maxBirthYear: Number,
        },
        junior: {
            minBirthYear: Number,
            maxBirthYear: Number,
        },
        senior: {
            maxBirthYear: Number,
        },
    },

    weightCategories: [
        // ...
    ],

    status: String,
});

const Competition = mongoose.model("Competition", competitionSchema)

export default Competition