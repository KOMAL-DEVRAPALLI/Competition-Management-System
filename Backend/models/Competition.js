import mongoose from "mongoose";


// =====================================
// COMPETITION FEATURE CONFIGURATION
//
// Defines which application features
// are required by this competition.
//
// This is NOT live competition state.
// =====================================

const competitionFeaturesSchema =
    new mongoose.Schema(
        {

            registration: {
                type: Boolean,
                default: true,
            },

            registrationNumber: {
                type: Boolean,
                default: true,
            },

            existingAthleteSelection: {
                type: Boolean,
                default: true,
            },

            documents: {
                type: Boolean,
                default: true,
            },

            coachInformation: {
                type: Boolean,
                default: true,
            },

            weighIn: {
                type: Boolean,
                default: true,
            },

            startList: {
                type: Boolean,
                default: true,
            },

            liveScore: {
                type: Boolean,
                default: true,
            },

            officialsScreen: {
                type: Boolean,
                default: true,
            },

            publicScoreboard: {
                type: Boolean,
                default: true,
            },

            receipt: {
                type: Boolean,
                default: true,
            },

        },
        {
            _id: false,
        }
    );


// =====================================
// COMPETITION WORKFLOW CONFIGURATION
// =====================================

const workflowSchema =
    new mongoose.Schema(
        {

            allowExistingAthleteSelection: {
                type: Boolean,
                default: true,
            },

            allowNewAthleteCreation: {
                type: Boolean,
                default: true,
            },

            ageCategoryRequired: {
                type: Boolean,
                default: true,
            },

            weightCategoryRequired: {
                type: Boolean,
                default: true,
            },

            bodyWeightRequired: {
                type: Boolean,
                default: true,
            },

            openingLiftsRequired: {
                type: Boolean,
                default: true,
            },

        },
        {
            _id: false,
        }
    );


// =====================================
// ATHLETE REQUIREMENTS
//
// These are requirements for THIS
// competition.
//
// They do NOT change the Athlete
// master record.
// =====================================

const athleteRequirementsSchema =
    new mongoose.Schema(
        {

            fullName: {
                type: Boolean,
                default: true,
            },

            gender: {
                type: Boolean,
                default: true,
            },

            dob: {
                type: Boolean,
                default: true,
            },

            phone: {
                type: Boolean,
                default: false,
            },

            email: {
                type: Boolean,
                default: false,
            },

            address: {
                type: Boolean,
                default: false,
            },

            club: {
                type: Boolean,
                default: false,
            },

            coach: {
                type: Boolean,
                default: false,
            },

            // =================================
            // SCHOOL GAMES
            // =================================

            schoolName: {
                type: Boolean,
                default: false,
            },

        },
        {
            _id: false,
        }
    );


// =====================================
// COMPETITION SCHEMA
// =====================================

const competitionSchema = new mongoose.Schema(
    {

        // =====================================
        // BASIC INFORMATION
        // =====================================

        competitionName: {
            type: String,
            trim: true,
        },


        // =====================================
        // COMPETITION TYPE
        //
        // ASSOCIATION:
        // Existing SDWA association-style
        // competitions.
        //
        // SCHOOL_GAMES:
        // U17 / U19 school games.
        // =====================================

        competitionType: {
            type: String,

            enum: [
                "ASSOCIATION",
                "SCHOOL_GAMES",
            ],

            default: "ASSOCIATION",

            required: true,
        },


        // =====================================
        // REGISTRATION PREFIX
        // =====================================

        registrationPrefix: {
            type: String,
            trim: true,
        },


        year: {
            type: Number,
        },


        venue: {
            type: String,
            trim: true,
        },


        startDate: {
            type: Date,
        },


        endDate: {
            type: Date,
        },


        // =====================================
        // REGISTRATION PERIOD
        // =====================================

        registrationStart: {
            type: Date,
        },


        registrationEnd: {
            type: Date,
        },


        // =====================================
        // COMPETITION FEATURES
        // =====================================

        features: {
            type: competitionFeaturesSchema,

            default: () => ({}),
        },


        // =====================================
        // COMPETITION WORKFLOW
        // =====================================

        workflow: {
            type: workflowSchema,

            default: () => ({}),
        },


        // =====================================
        // ATHLETE REQUIREMENTS
        // =====================================

        athleteRequirements: {
            type: athleteRequirementsSchema,

            default: () => ({}),
        },


        // =====================================
        // COMPETITION FORMAT
        // =====================================

        competitionFormat: {
            type: String,

            enum: [
                "TOTAL_ONLY",
                "SEPARATE_LIFT_CLASSIFICATION",
            ],

            default: null,
        },


        // =====================================
        // LIVE COMPETITION STATE
        //
        // DO NOT REMOVE.
        // Existing Live Score functionality
        // depends on this structure.
        // =====================================

        liveCompetition: {

            isStarted: {
                type: Boolean,

                default: false,
            },


            currentPhase: {
                type: String,

                enum: [
                    "SNATCH",
                    "CLEAN_AND_JERK",
                    "COMPLETED",
                ],

                default: "SNATCH",
            },


            currentWorkingSheet: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "WorkingSheet",

                default: null,
            },


            currentCompetitionEntry: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "CompetitionEntry",

                default: null,
            },


            startedAt: {
                type: Date,
            },


            completedAt: {
                type: Date,
            },

        },


        // =====================================
        // ELIGIBILITY RULES
        //
        // ASSOCIATION competitions use:
        // - youth
        // - junior
        // - senior
        //
        // SCHOOL GAMES competitions use:
        // - u17
        // - u19
        //
        // The competition type determines
        // which configuration is applicable.
        // =====================================

        eligibilityRules: {

            // =================================
            // ASSOCIATION
            // =================================

            youth: {

                minBirthYear:
                    Number,

                maxBirthYear:
                    Number,

            },


            junior: {

                minBirthYear:
                    Number,

                maxBirthYear:
                    Number,

            },


            senior: {

                maxBirthYear:
                    Number,

            },


            // =================================
            // SCHOOL GAMES
            // =================================

            u17: {

                minBirthYear:
                    Number,

                maxBirthYear:
                    Number,

            },


            u19: {

                minBirthYear:
                    Number,

                maxBirthYear:
                    Number,

            },

        },


        // =====================================
        // WEIGHT CATEGORIES
        // =====================================

        weightCategories: [
            // ...
        ],


        // =====================================
        // COMPETITION RULES
        // =====================================

        rules: {

            weighInTolerance: {

                type: Number,

                default: 0.250,

                min: 0,

            },

        },


        // =====================================
        // COMPETITION STATUS
        // =====================================

        status: {

            type: String,

            trim: true,

        },

    },

    {
        timestamps: true,
    }
);


// =====================================
// MODEL
// =====================================

const Competition =
    mongoose.model(
        "Competition",
        competitionSchema
    );


export default Competition;