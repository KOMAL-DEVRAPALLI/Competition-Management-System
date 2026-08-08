import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema(
    {
        attemptNo: {
            type: Number,
            required: true,
            min: 1,
            max: 3,
        },

        declaredWeight: {
            type: Number,
            default: null,
            min: 0,
        },

        declaredAt: {
            type: Date,
            default: null,
        },

        result: {
            type: String,
            enum: ["PENDING", "GOOD", "NO_LIFT"],
            default: "PENDING",
        },
    },
    { _id: false }
);

const competitionEntrySchema = new mongoose.Schema(
    {
        competitionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Competition",
            required: true,
        },

        athleteId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Athlete",
            required: true,
        },
        competitionCategory: {
            ageCategory: {
                type: String,
                required: true,
                trim: true,
            },
        },
        official: {
            bodyWeight: {
                type: Number,
                default: null,
                min: 0,
            },
            eligibleWeightCategories: {
                type: [String],
                trim: true,
                default: [],
            },
            selectedWeightCategory: {
                type: String,
                trim: true,
                default: null,
            },
            finalWeightCategory: {
                type: String,
                trim: true,
                default: null,
            },
            lotNumber: {
                type: Number,
                default: null,
                min: 1,
            },
            weighInCompletedAt: {
                type: Date
            },
            weighedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Admin",
                default: null
            }
        },

        opening: {
            snatch: {
                type: Number,
                default: null,
                min: 0,
            },

            cleanJerk: {
                type: Number,
                default: null,
                min: 0,
            },
        },

        snatchAttempts: {
            type: [attemptSchema],
            default: [
                { attemptNo: 1 },
                { attemptNo: 2 },
                { attemptNo: 3 },
            ],
        },

        cleanJerkAttempts: {
            type: [attemptSchema],
            default: [
                { attemptNo: 1 },
                { attemptNo: 2 },
                { attemptNo: 3 },
            ],
        },

        results: {
            bestSnatch: {
                type: Number,
                default: 0,
            },

            bestCleanJerk: {
                type: Number,
                default: 0,
            },

            total: {
                type: Number,
                default: 0,
            },

            rank: {
                type: Number,
                default: null,
            },
        },

        status: {
            type: String,
            enum: [
                "PENDING",
                "WEIGHED",
                "READY",
                "COMPETING",
                "COMPLETED",
            ],
            default: "PENDING",
        },

        remarks: {
            type: String,
            trim: true,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

competitionEntrySchema.index(
    {
        competitionId: 1,
        athleteId: 1,
        "competitionCategory.ageCategory": 1,
    },
    {
        unique: true,
    }
);

const CompetitionEntry = mongoose.model(
    "CompetitionEntry",
    competitionEntrySchema
);

export default CompetitionEntry;