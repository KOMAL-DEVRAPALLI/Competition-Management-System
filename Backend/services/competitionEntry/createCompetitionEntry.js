import Competition from "../../models/Competition.js";
import CompetitionEntry from "../../models/CompetitionEntry.js";


// =====================================
// CREATE COMPETITION ENTRY
//
// Creates a competition-specific entry
// for an existing athlete.
//
// IMPORTANT:
// - Athlete master data is NOT copied.
// - Athlete master data is NOT modified.
// - Competition-specific participation
//   data belongs to CompetitionEntry.
// - The same athlete may participate in
//   different competitions.
// =====================================

const createCompetitionEntry = async ({
    competitionId,
    athleteId,
    ageCategory,
}) => {

    // =====================================
    // REQUIRED INPUT
    // =====================================

    if (!competitionId) {

        throw new Error(
            "Competition ID is required."
        );

    }

    if (!athleteId) {

        throw new Error(
            "Athlete ID is required."
        );

    }

    const normalizedAgeCategory =
        String(ageCategory ?? "").trim();

    if (!normalizedAgeCategory) {

        throw new Error(
            "Age category is required."
        );

    }


    // =====================================
    // VERIFY COMPETITION
    //
    // The entry must belong to a real
    // competition.
    // =====================================

    const competition =
        await Competition.findById(
            competitionId
        );

    if (!competition) {

        const error =
            new Error(
                "Competition not found."
            );

        error.statusCode = 404;

        throw error;

    }


    // =====================================
    // PREVENT DUPLICATE ENTRY
    //
    // Same athlete may participate in
    // different competitions.
    //
    // Therefore competitionId is part of
    // the identity of the entry.
    // =====================================

    const existingEntry =
        await CompetitionEntry.findOne({

            competitionId,

            athleteId,

            "competitionCategory.ageCategory":
                normalizedAgeCategory,

        });


    if (existingEntry) {

        const error =
            new Error(
                "Competition entry already exists."
            );

        error.statusCode = 409;

        throw error;

    }


    // =====================================
    // CREATE COMPETITION-SPECIFIC ENTRY
    //
    // Only competition participation
    // information is stored here.
    //
    // Athlete master data remains in
    // Athlete.
    // =====================================

    const competitionEntry =
        await CompetitionEntry.create({

            competitionId,

            athleteId,

            competitionCategory: {

                ageCategory:
                    normalizedAgeCategory,

            },

        });


    // =====================================
    // RETURN
    // =====================================

    return competitionEntry;

};


export default createCompetitionEntry;