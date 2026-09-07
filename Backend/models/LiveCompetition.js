import mongoose from "mongoose";


const liveCompetitionSchema =
    new mongoose.Schema(
        {

            // =====================================
            // COMPETITION
            // =====================================

            competitionId: {

                type:
                    mongoose.Schema.Types.ObjectId,

                ref:
                    "Competition",

                required:
                    true,

            },


            // =====================================
            // GENDER / SESSION / SCOPE
            // =====================================

            gender: {

                type:
                    String,

                enum: [
                    "male",
                    "female",
                ],

                required:
                    true,

            },


            sessionName: {

                type:
                    String,

                trim:
                    true,

                default:
                    "",

            },


            selectedWeightCategories: {

                type:
                    [String],

                default:
                    [],

            },


            // =====================================
            // CURRENT CALLING ATHLETE
            //
            // This represents the athlete currently
            // resolved by the Officials calling state.
            //
            // IMPORTANT:
            //
            // This is intentionally separate from
            // platformEntryId.
            //
            // An official declaration correction may
            // change the calling priority without
            // changing the athlete physically being
            // processed on the platform.
            // =====================================

            currentEntryId: {

                type:
                    mongoose.Schema.Types.ObjectId,

                ref:
                    "CompetitionEntry",

                default:
                    null,

            },


            // =====================================
            // PHYSICAL PLATFORM ATHLETE
            //
            // This identifies the athlete whose lift
            // is actually active / being judged.
            //
            // Normally:
            //
            //     platformEntryId === currentEntryId
            //
            // But during an official declaration
            // correction they may temporarily differ.
            //
            // Example:
            //
            //     C is physically on platform
            //     B declaration changes 48 -> 47
            //
            // Result:
            //
            //     currentEntryId  = B
            //     platformEntryId = C
            //
            // processLift() must continue using the
            // physical platform athlete.
            // =====================================

            platformEntryId: {

                type:
                    mongoose.Schema.Types.ObjectId,

                ref:
                    "CompetitionEntry",

                default:
                    null,

            },


            // =====================================
            // CURRENT PHASE
            // =====================================

            currentPhase: {

                type:
                    String,

                enum: [

                    "SNATCH",

                    "BREAK",

                    "CLEAN_JERK",

                    "COMPLETED",

                ],

                default:
                    "SNATCH",

            },


            // =====================================
            // SESSION STATUS
            // =====================================

            status: {

                type:
                    String,

                enum: [

                    "READY",

                    "RUNNING",

                    "PAUSED",

                    "FINISHED",

                    "RECOVERY_REQUIRED",

                ],

                default:
                    "READY",

            },


            // =====================================
            // AUTHORITATIVE STATE VERSION
            //
            // Incremented for accepted state-changing
            // live competition transitions.
            //
            // Used for stale Officials Screen
            // protection and concurrency control.
            // =====================================

            stateVersion: {

                type:
                    Number,

                required:
                    true,

                default:
                    0,

                min:
                    0,

            },


            // =====================================
            // ATTEMPT HISTORY SEQUENCE COUNTER
            //
            // This is the NEXT sequence number
            // available for a performed attempt.
            //
            // It is NOT the athlete attempt number.
            //
            // Example:
            //
            //     counter = 1
            //     performed lift gets sequence 1
            //     counter becomes 2
            // =====================================

            attemptSequenceCounter: {

                type:
                    Number,

                required:
                    true,

                default:
                    1,

                min:
                    1,

            },


            // =====================================
            // STATE INTEGRITY
            //
            // Automatic progression must never guess
            // when authoritative history is missing
            // or contradictory.
            // =====================================

            integrity: {

                status: {

                    type:
                        String,

                    enum: [

                        "VALID",

                        "RECOVERY_REQUIRED",

                    ],

                    default:
                        "VALID",

                },


                reason: {

                    type:
                        String,

                    trim:
                        true,

                    default:
                        "",

                },


                detectedAt: {

                    type:
                        Date,

                    default:
                        null,

                },

            },

        },

        {

            timestamps:
                true,

        }

    );


// =====================================
// ONE LIVE SESSION PER
// COMPETITION + GENDER
// =====================================

liveCompetitionSchema.index(

    {

        competitionId:
            1,

        gender:
            1,

    },

    {

        unique:
            true,

    }

);


export default mongoose.model(

    "LiveCompetition",

    liveCompetitionSchema

);