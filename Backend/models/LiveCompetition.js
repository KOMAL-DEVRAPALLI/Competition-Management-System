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
        // Gender / Session / Scope
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
        // Temporary authoritative platform
        // state.
        //
        // Later, the automatic queue/state
        // resolution system will determine
        // this value.
        // -----------------------------------

        currentEntryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CompetitionEntry",
            default: null,
        },

        // -----------------------------------
        // CURRENT PHASE
        //
        // This represents the authoritative
        // competition phase.
        //
        // BREAK is a transition state when
        // applicable.
        // COMPLETED represents the terminal
        // competition phase.
        // -----------------------------------

        currentPhase: {
            type: String,
            enum: [
                "SNATCH",
                "BREAK",
                "CLEAN_JERK",
                "COMPLETED",
            ],
            default: "SNATCH",
        },

        // -----------------------------------
        // SESSION STATUS
        //
        // Lifecycle state is separate from
        // competition phase.
        // -----------------------------------

        status: {
            type: String,
            enum: [
                "READY",
                "RUNNING",
                "PAUSED",
                "FINISHED",
                "RECOVERY_REQUIRED",
            ],
            default: "READY",
        },

        // -----------------------------------
        // AUTHORITATIVE STATE VERSION
        //
        // Incremented for every accepted
        // state-changing live competition
        // transition.
        //
        // Used later to reject stale
        // Officials Screen actions.
        // -----------------------------------

        stateVersion: {
            type: Number,
            required: true,
            default: 0,
            min: 0,
        },

        // -----------------------------------
        // ATTEMPT HISTORY SEQUENCE COUNTER
        //
        // Represents the NEXT historical
        // sequence number available for an
        // actually performed attempt.
        //
        // This is NOT the athlete's attempt
        // number.
        //
        // Example:
        //
        // counter = 1
        // attempt performed → sequence 1
        // counter becomes 2
        // -----------------------------------

        attemptSequenceCounter: {
            type: Number,
            required: true,
            default: 1,
            min: 1,
        },

        // -----------------------------------
        // STATE INTEGRITY
        //
        // Automatic progression must never
        // guess when authoritative history
        // is missing or contradictory.
        // -----------------------------------

        integrity: {
            status: {
                type: String,
                enum: [
                    "VALID",
                    "RECOVERY_REQUIRED",
                ],
                default: "VALID",
            },

            reason: {
                type: String,
                trim: true,
                default: "",
            },

            detectedAt: {
                type: Date,
                default: null,
            },
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