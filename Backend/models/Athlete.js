import mongoose from "mongoose";

const personalInfoSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    gender: {
        type: String,
        enum: ["Male", "Female"],
        trim: true,
        required: true
    },
    dob: {
        type: Date,
        required: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    }
}, { _id: false })

const competitionInfoSchema = new mongoose.Schema({
    club: String,
    coach: String,
    coachPhone: String,
    competitionName: String,
    venue: String,
    startDate: Date,
    endDate: Date,
}, { _id: false });

const documentsSchema = new mongoose.Schema({
    passportPhoto: {
        url: {
            type: String,
            default: null,
            trim: true
        },
        publicId: {
            type: String,
            default: null,
            trim: true
        },
    },
    aadhaar: {
        url: {
            type: String,
            default: null,
            trim: true
        },
        publicId: {
            type: String,
            default: null,
            trim: true
        },
    },
    birthCertificate: {
        url: {
            type: String,
            default: null,
            trim: true
        },
        publicId: {
            type: String,
            default: null,
            trim: true
        }
    },
    iwlfCard: {
    url: {
        type: String,
        default: null,
        trim: true
    },
    publicId: {
        type: String,
        default: null,
        trim: true
    }
},
}, { _id: false })

const verificationSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ["Verified", "Rejected", "Pending"],
        default: "Pending",
        trim: true
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },
    verifiedAt: {
        type: Date
    },
    rejectionReason: {
        type: String,
        trim: true

    }
}, { _id: false })

const participationSchema = new mongoose.Schema(
    {
        category: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { _id: false });

const athleteSchema = new mongoose.Schema({
    registrationNo: {
        type: String,
        required: true,
        unique: true,
    },
    competition: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Competition",
        required: true
    },
    personalInfo: {
        type: personalInfoSchema,
        required: true
    },
    competitionInfo: {
        type: competitionInfoSchema,
    },
    participations: {
        type: [participationSchema],
        required: true,
        validate: {
            validator: (value) => value.length > 0,
            message: "At least one participation is required."
        }
    },
    documents: {
        type: documentsSchema,
        required: true,
    },
    verification: {
        type: verificationSchema,
        required: true,
    }
}, { timestamps: true })


const Athlete = mongoose.model("Athlete", athleteSchema)
export default Athlete