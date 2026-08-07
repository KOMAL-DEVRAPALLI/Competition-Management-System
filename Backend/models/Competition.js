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
    // Live Competition State
liveCompetition: {
    isStarted: {
        type: Boolean,
        default: false,
    },

    currentPhase: {
        type: String,
        enum: ["SNATCH", "CLEAN_AND_JERK", "COMPLETED"],
        default: "SNATCH",
    },

    currentWorkingSheet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WorkingSheet",
        default: null,
    },

    currentCompetitionEntry: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CompetitionEntry",
        default: null,
    },

    startedAt: Date,

    completedAt: Date,
},
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

    rules: {
        weighInTolerance: {
            type: Number,
            default: 0.250,
            min: 0,
        },
    },

    status: String,
});

const Competition = mongoose.model("Competition", competitionSchema)

export default Competition