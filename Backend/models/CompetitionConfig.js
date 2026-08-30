import mongoose from "mongoose";

const competitionConfigSchema = new mongoose.Schema(
    {
        competitionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Competition",
            required: true,
            unique: true,
            index: true,
        },

        // =====================================
        // ATHLETE WORKFLOW
        // =====================================

        athleteWorkflow: {
            allowExistingAthleteSelection: {
                type: Boolean,
                default: false,
            },

            allowNewAthleteCreation: {
                type: Boolean,
                default: true,
            },
        },

        // =====================================
        // REGISTRATION
        // =====================================

        registration: {
            enabled: {
                type: Boolean,
                default: true,
            },

            registrationNumberRequired: {
                type: Boolean,
                default: true,
            },
        },

        // =====================================
        // ATHLETE INFORMATION
        // =====================================

        athleteFields: {
            phoneRequired: {
                type: Boolean,
                default: true,
            },

            emailRequired: {
                type: Boolean,
                default: true,
            },

            addressRequired: {
                type: Boolean,
                default: true,
            },

            coachEnabled: {
                type: Boolean,
                default: true,
            },

            coachRequired: {
                type: Boolean,
                default: false,
            },
        },

        // =====================================
        // COMPETITION ENTRY FIELDS
        //
        // Controls information required for
        // an athlete's participation in this
        // specific competition.
        // =====================================

        entryFields: {
            bodyWeightRequired: {
                type: Boolean,
                default: false,
            },

            weightCategoryRequired: {
                type: Boolean,
                default: false,
            },

            openingSnatchRequired: {
                type: Boolean,
                default: false,
            },

            openingCleanJerkRequired: {
                type: Boolean,
                default: false,
            },
        },

        // =====================================
        // DOCUMENTS
        // =====================================

        documents: {
            enabled: {
                type: Boolean,
                default: true,
            },

            required: {
                type: Boolean,
                default: true,
            },
        },

        // =====================================
        // WEIGH-IN
        // =====================================

        weighIn: {
            enabled: {
                type: Boolean,
                default: true,
            },

            required: {
                type: Boolean,
                default: true,
            },
        },

        // =====================================
        // START LIST
        // =====================================

        startList: {
            enabled: {
                type: Boolean,
                default: true,
            },
        },

        // =====================================
        // LIVE SCORE
        // =====================================

        liveScore: {
            enabled: {
                type: Boolean,
                default: true,
            },

            mode: {
                type: String,
                default: "WEIGHTLIFTING",
                trim: true,
            },
        },

        // =====================================
        // OFFICIALS SCREEN
        // =====================================

        officialsScreen: {
            enabled: {
                type: Boolean,
                default: true,
            },
        },

        // =====================================
        // PUBLIC SCOREBOARD
        // =====================================

        publicScoreboard: {
            enabled: {
                type: Boolean,
                default: true,
            },
        },
    },
    {
        timestamps: true,
    }
);

const CompetitionConfig = mongoose.model(
    "CompetitionConfig",
    competitionConfigSchema
);

export default CompetitionConfig;