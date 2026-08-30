import mongoose from "mongoose";


// =====================================
// PERSONAL INFORMATION
// =====================================

const personalInfoSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,

            required: function () {
                return (
                    this.parent().parent().source ===
                    "REGISTRATION" ||
                    this.parent().parent().source ===
                    "ADMIN"
                );
            },

            trim: true,
        },

        gender: {
            type: String,

            enum: [
                "Male",
                "Female",
            ],

            required: function () {
                return (
                    this.parent().parent().source ===
                    "REGISTRATION" ||
                    this.parent().parent().source ===
                    "ADMIN"
                );
            },

            trim: true,
        },

        dob: {
            type: Date,

            required: function () {
                return (
                    this.parent().parent().source ===
                    "REGISTRATION" ||
                    this.parent().parent().source ===
                    "ADMIN"
                );
            },
        },

        // =================================
        // MOBILE NUMBER
        //
        // Required for both workflows.
        // =================================

        phone: {
            type: String,

            required: function () {
                return (
                    this.parent().parent().source ===
                    "REGISTRATION" ||
                    this.parent().parent().source ===
                    "ADMIN"
                );
            },

            trim: true,
        },

        // =================================
        // REGISTRATION-ONLY INFORMATION
        // =================================

        email: {
            type: String,

            required: function () {
                return (
                    this.parent().parent().source ===
                    "REGISTRATION"
                );
            },

            trim: true,

            lowercase: true,
        },

        address: {
            type: String,

            required: function () {
                return (
                    this.parent().parent().source ===
                    "REGISTRATION"
                );
            },

            trim: true,
        },
    },
    {
        _id: false,
    }
);


// =====================================
// COMPETITION INFORMATION
// =====================================

const competitionInfoSchema = new mongoose.Schema(
    {
        // =================================
        // ASSOCIATION / REGISTRATION
        // =================================

        club: {
            type: String,
            trim: true,
        },

        coach: {
            type: String,
            trim: true,
        },

        coachPhone: {
            type: String,
            trim: true,
        },

        // =================================
        // SCHOOL GAMES
        // =================================

        schoolName: {
            type: String,
            trim: true,
        },

        // =================================
        // COMPETITION SNAPSHOT
        // =================================

        competitionName: {
            type: String,
            trim: true,
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
    },
    {
        _id: false,
    }
);


// =====================================
// DOCUMENTS
//
// Registration athletes require documents.
// Admin-created athletes do not.
// =====================================

const documentsSchema = new mongoose.Schema(
    {
        passportPhoto: {
            url: {
                type: String,
                default: null,
                trim: true,
            },

            publicId: {
                type: String,
                default: null,
                trim: true,
            },
        },

        aadhaar: {
            url: {
                type: String,
                default: null,
                trim: true,
            },

            publicId: {
                type: String,
                default: null,
                trim: true,
            },
        },

        birthCertificate: {
            url: {
                type: String,
                default: null,
                trim: true,
            },

            publicId: {
                type: String,
                default: null,
                trim: true,
            },
        },

        iwlfCard: {
            url: {
                type: String,
                default: null,
                trim: true,
            },

            publicId: {
                type: String,
                default: null,
                trim: true,
            },
        },
    },
    {
        _id: false,
    }
);


// =====================================
// VERIFICATION
// =====================================

const verificationSchema = new mongoose.Schema(
    {
        status: {
            type: String,

            enum: [
                "Verified",
                "Rejected",
                "Pending",
            ],

            default: "Pending",

            trim: true,
        },

        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,

            ref: "Admin",
        },

        verifiedAt: {
            type: Date,
        },

        rejectionReason: {
            type: String,

            trim: true,
        },
    },
    {
        _id: false,
    }
);


// =====================================
// PARTICIPATION
//
// Used by the existing registration
// workflow.
//
// Admin-created school-game athletes
// do not need this.
// =====================================

const participationSchema = new mongoose.Schema(
    {
        category: {
            type: String,

            required: true,

            trim: true,
        },
    },
    {
        _id: false,
    }
);


// =====================================
// ATHLETE
// =====================================

const athleteSchema = new mongoose.Schema(
    {
        // =================================
        // SOURCE
        // =================================

        source: {
            type: String,

            enum: [
                "REGISTRATION",
                "ADMIN",
            ],

            default: "REGISTRATION",

            required: true,
        },


        // =================================
        // REGISTRATION NUMBER
        //
        // Registration-created athletes
        // require a registration number.
        //
        // Admin-created athletes do not.
        // =================================

        registrationNo: {
            type: String,

            required: function () {
                return (
                    this.source ===
                    "REGISTRATION"
                );
            },

            trim: true,

            default: undefined,
        },


        // =================================
        // COMPETITION
        // =================================

        competition: {
            type: mongoose.Schema.Types.ObjectId,

            ref: "Competition",

            required: true,
        },


        // =================================
        // PERSONAL INFORMATION
        // =================================

        personalInfo: {
            type: personalInfoSchema,

            required: true,
        },


        // =================================
        // COMPETITION INFORMATION
        // =================================

        competitionInfo: {
            type: competitionInfoSchema,
        },


        // =================================
        // PARTICIPATIONS
        //
        // REGISTRATION:
        // At least one participation.
        //
        // ADMIN:
        // Empty/omitted is allowed because
        // U17/U19 is stored on CompetitionEntry.
        // =================================

        participations: {
            type: [
                participationSchema,
            ],

            required: function () {
                return (
                    this.source ===
                    "REGISTRATION"
                );
            },

            validate: {
                validator: function (value) {

                    if (
                        this.source ===
                        "ADMIN"
                    ) {
                        return true;
                    }

                    return (
                        Array.isArray(value) &&
                        value.length > 0
                    );
                },

                message:
                    "At least one participation is required.",
            },
        },


        // =================================
        // DOCUMENTS
        //
        // Registration requires documents.
        // Admin-created school athletes do not.
        // =================================

        documents: {
            type: documentsSchema,

            required: function () {
                return (
                    this.source ===
                    "REGISTRATION"
                );
            },
        },


        // =================================
        // VERIFICATION
        // =================================

        verification: {
            type: verificationSchema,

            required: true,

            default: () => ({
                status: "Pending",
            }),
        },
    },

    {
        timestamps: true,
    }
);


// =====================================
// REGISTRATION NUMBER INDEX
//
// IMPORTANT:
//
// Only actual registration numbers
// participate in the unique index.
//
// ADMIN athletes have no registrationNo
// and therefore do not conflict with each
// other.
// =====================================

athleteSchema.index(
    {
        registrationNo: 1,
    },
    {
        unique: true,

        partialFilterExpression: {
            registrationNo: {
                $type: "string",
            },
        },
    }
);


// =====================================
// MODEL
// =====================================

const Athlete =
    mongoose.model(
        "Athlete",
        athleteSchema
    );


export default Athlete;