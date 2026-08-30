import mongoose from "mongoose";


// =====================================
// ATTEMPT
// =====================================

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
            enum: [
                "PENDING",
                "GOOD",
                "NO_LIFT",
            ],
            default: "PENDING",
        },

        // =====================================
        // ACTUAL LIFT EXECUTION TIME
        // =====================================

        performedAt: {
            type: Date,
            default: null,
        },

        // =====================================
        // GLOBAL ATTEMPT EXECUTION SEQUENCE
        // =====================================

        performedSequence: {
            type: Number,
            default: null,
            min: 1,
        },
    },
    {
        _id: false,
    }
);


// =====================================
// COMPETITION ENTRY
// =====================================

const competitionEntrySchema =
    new mongoose.Schema(
        {

            // =================================
            // COMPETITION
            // =================================

            competitionId: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "Competition",

                required: true,
            },


            // =================================
            // ATHLETE
            // =================================

            athleteId: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "Athlete",

                required: true,
            },


            // =================================
            // COMPETITION CATEGORY
            //
            // Competition-specific age category.
            //
            // Examples:
            // U17
            // U19
            // =================================

            competitionCategory: {

                ageCategory: {
                    type: String,

                    required: true,

                    trim: true,
                },

            },


            // =================================
            // SCHOOL
            //
            // Competition-specific information.
            //
            // Used for School Games.
            //
            // This is intentionally NOT stored
            // in Athlete master information because
            // an athlete can participate in another
            // competition with different
            // competition-specific information.
            // =================================

            schoolName: {
                type: String,

                trim: true,

                default: "",
            },


            // =================================
            // OFFICIAL / WEIGH-IN INFORMATION
            // =================================

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
                    type: Date,
                },


                weighedBy: {
                    type:
                        mongoose.Schema.Types.ObjectId,

                    ref: "Admin",

                    default: null,
                },

            },


            // =================================
            // OPENING LIFTS
            // =================================

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


            // =================================
            // SNATCH ATTEMPTS
            // =================================

            snatchAttempts: {

                type: [attemptSchema],

                default: [
                    {
                        attemptNo: 1,
                    },
                    {
                        attemptNo: 2,
                    },
                    {
                        attemptNo: 3,
                    },
                ],

            },


            // =================================
            // CLEAN & JERK ATTEMPTS
            // =================================

            cleanJerkAttempts: {

                type: [attemptSchema],

                default: [
                    {
                        attemptNo: 1,
                    },
                    {
                        attemptNo: 2,
                    },
                    {
                        attemptNo: 3,
                    },
                ],

            },


            // =================================
            // RESULTS
            // =================================

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


            // =================================
            // COMPETITION STATUS
            // =================================

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


            // =================================
            // REMARKS
            // =================================

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


// =====================================
// UNIQUE COMPETITION ENTRY
//
// One athlete can have one entry per
// age category within a competition.
//
// Example:
//
// Competition A + Athlete X + U17
// Competition A + Athlete X + U19
//
// are technically separate entries.
// =====================================

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


// =====================================
// MODEL
// =====================================

const CompetitionEntry =
    mongoose.model(
        "CompetitionEntry",
        competitionEntrySchema
    );


export default CompetitionEntry;