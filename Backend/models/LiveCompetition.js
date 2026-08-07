import mongoose from "mongoose";

const liveCompetitionSchema = new mongoose.Schema(
    {
        competitionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Competition",
            required: true,
        },

        gender: {
            type: String,
            enum: ["male", "female"],
            required: true,
        },

        currentEntryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CompetitionEntry",
            default: null,
        },
        gender: {
            type: String,
            enum: ["male", "female"],
            required: true,
        },

        currentEntryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CompetitionEntry",
            default: null,
        },

        prepareEntryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CompetitionEntry",
            default: null,
        },

        currentPhase: {
            type: String,
            enum: ["SNATCH", "CLEAN_JERK"],
            default: "SNATCH",
        },

        status: {
            type: String,
            enum: [
                "READY",
                "RUNNING",
                "FINISHED",
            ],
            default: "READY",
        },
    },
    {
        timestamps: true,
    }
);

liveCompetitionSchema.index(
    {
        competitionId: 1,
        gender: 1,
    },
    {
        unique: true,
    }
);

export default mongoose.model(
    "LiveCompetition",
    liveCompetitionSchema
);