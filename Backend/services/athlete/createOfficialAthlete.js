import Athlete from "../../models/Athlete.js";
import Competition from "../../models/Competition.js";
import CompetitionEntry from "../../models/CompetitionEntry.js";

const createOfficialAthlete = async ({
    competitionId,
    fullName,
    gender,
    dob,
    club,
    coach,
}) => {

    if (!competitionId) {
        throw new Error("Competition ID is required.");
    }

    if (!fullName?.trim()) {
        throw new Error("Athlete name is required.");
    }

    if (!["Male", "Female"].includes(gender)) {
        throw new Error("Invalid gender.");
    }

    if (!dob) {
        throw new Error("Date of birth is required.");
    }

    const competition =
        await Competition.findById(competitionId);

    if (!competition) {
        throw new Error("Competition not found.");
    }

    // -------------------------------------
    // CREATE ATHLETE
    // -------------------------------------

    const athlete = await Athlete.create({

        competition: competition._id,

        // No registration number.
        registrationNo: null,

        personalInfo: {
            fullName: fullName.trim(),
            gender,
            dob,
        },

        competitionInfo: {
            club: club?.trim() || "",
            coach: coach?.trim() || "",
        },

        participations: [],

        verification: {
            status: "Verified",
            verifiedBy: null,
            verifiedAt: new Date(),
            rejectionReason: null,
        },

    });

    // -------------------------------------
    // CREATE COMPETITION ENTRY
    // -------------------------------------

    const competitionEntry =
        await CompetitionEntry.create({

            competitionId:
                competition._id,

            athleteId:
                athlete._id,

        });

    return {
        athlete,
        competitionEntry,
    };
};

export default createOfficialAthlete;