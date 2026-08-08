import mongoose from "mongoose";

const liveCompetitionSchema = new mongoose.Schema(
    {
        // -----------------------------------
        // Competition
        // -----------------------------------

        competitionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Competition",
            required: true,
        },

        // -----------------------------------
        // Gender / Session
        // -----------------------------------

        gender: {
            type: String,
            enum: ["male", "female"],
            required: true,
        },

        sessionName: {
            type: String,
            trim: true,
            default: "",
        },

        selectedWeightCategories: {
            type: [String],
            default: [],
        },

        // -----------------------------------
        // CURRENT ATHLETE
        //
        // This is selected MANUALLY by the
        // official.
        //
        // The system must NEVER automatically
        // replace this athlete.
        // -----------------------------------

        currentEntryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CompetitionEntry",
            default: null,
        },

        // -----------------------------------
        // CURRENT PHASE
        // -----------------------------------

        currentPhase: {
            type: String,
            enum: [
                "SNATCH",
                "CLEAN_JERK",
            ],
            default: "SNATCH",
        },

        // -----------------------------------
        // SESSION STATUS
        // -----------------------------------

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

// -----------------------------------
// One live session per competition +
// gender
// -----------------------------------

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