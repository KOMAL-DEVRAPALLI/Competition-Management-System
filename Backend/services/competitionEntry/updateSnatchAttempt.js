import CompetitionEntry from "../../models/CompetitionEntry.js";
import updateCompetitionResults from "../calculations/updateCompetitionResults.js";


// =====================================
// UPDATE SNATCH ATTEMPTS
//
// Responsibility:
//
// 1. Load CompetitionEntry.
// 2. Update Snatch attempt history.
// 3. Persist Snatch attempt history.
// 4. Recalculate competition results.
//
// IMPORTANT:
//
// CompetitionEntry is the authoritative
// source for competition attempt history.
//
// LiveCompetition is responsible for
// live competition/session state.

//
// =====================================
//
// entryId:
//     CompetitionEntry._id
//
// =====================================


const updateSnatchAttempts = async (
    entryId,
    attempts,
    session = null
) => {

    // =====================================
    // VALIDATE INPUT
    // =====================================

    if (!entryId) {

        throw new Error(
            "Competition entry ID is required."
        );

    }


    if (!Array.isArray(attempts)) {

        throw new Error(
            "Snatch attempts must be an array."
        );

    }


    // =====================================
    // LOAD COMPETITION ENTRY
    // =====================================

    let query =
        CompetitionEntry.findById(
            entryId
        );


    if (session) {

        query =
            query.session(
                session
            );

    }


    const competitionEntry =
        await query;


    if (!competitionEntry) {

        throw new Error(
            "Competition entry not found."
        );

    }


    // =====================================
    // UPDATE SNATCH ATTEMPTS
    // =====================================

    competitionEntry.snatchAttempts =
        attempts;


    // =====================================
    // SAVE SNATCH ATTEMPTS
    // =====================================

    if (session) {

        await competitionEntry.save({
            session,
        });

    } else {

        await competitionEntry.save();

    }


    // =====================================
    // RECALCULATE COMPETITION RESULTS
    // =====================================

    await updateCompetitionResults(
        competitionEntry
    );


    // =====================================
    // RETURN UPDATED ENTRY
    // =====================================

    return competitionEntry;

};


export default updateSnatchAttempts;