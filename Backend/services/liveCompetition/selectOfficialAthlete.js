import CompetitionEntry from "../../models/CompetitionEntry.js";
import LiveCompetition from "../../models/LiveCompetition.js";
import getCurrentAttempt from "./getCurrentAttempt.js";

const selectOfficialAthlete = async ({
    competitionId,
    gender,
    entryId,
}) => {

    // -----------------------------------
    // Validate required data
    // -----------------------------------

    if (!competitionId) {
        throw new Error(
            "Competition ID is required."
        );
    }

    if (!gender) {
        throw new Error(
            "Gender is required."
        );
    }

    if (!entryId) {
        throw new Error(
            "Athlete entry ID is required."
        );
    }

    const normalizedGender =
        gender.toLowerCase();

    // -----------------------------------
    // Find live competition session
    // -----------------------------------

    const session =
        await LiveCompetition.findOne({
            competitionId,
            gender: normalizedGender,
        });

    if (!session) {
        throw new Error(
            "Live competition session not found."
        );
    }

    // -----------------------------------
    // Do not replace an athlete who is
    // already selected.
    //
    // Official must finish/clear the
    // current athlete first.
    // -----------------------------------

    if (session.currentEntryId) {

        throw new Error(
            "Another athlete is already selected. Complete or clear the current athlete first."
        );
    }

    // -----------------------------------
    // Find selected athlete
    // -----------------------------------

    const competitionEntry =
        await CompetitionEntry.findOne({
            _id: entryId,
            competitionId,
        }).populate("athleteId");

    if (!competitionEntry) {
        throw new Error(
            "Athlete is not part of this competition."
        );
    }

    // -----------------------------------
    // Verify athlete gender
    // -----------------------------------

    const athleteGender =
        competitionEntry
            .athleteId
            ?.personalInfo
            ?.gender;

    if (!athleteGender) {
        throw new Error(
            "Athlete gender is missing."
        );
    }

    if (
        athleteGender.toLowerCase() !==
        normalizedGender
    ) {
        throw new Error(
            "Athlete gender does not match the live session."
        );
    }

    // -----------------------------------
    // Get athlete's next attempt
    //
    // The OFFICIAL chooses the athlete.
    //
    // The SYSTEM determines whether this
    // is S1, S2, S3, CJ1, CJ2 or CJ3.
    // -----------------------------------

    const currentAttempt =
        getCurrentAttempt(
            competitionEntry
        );

    // -----------------------------------
    // Athlete has completed competition
    // -----------------------------------

    if (
        currentAttempt.completed
    ) {
        throw new Error(
            "Athlete has already completed the competition."
        );
    }

    // -----------------------------------
    // Verify phase
    //
    // Example:
    //
    // Live session = SNATCH
    // Athlete's next attempt = SNATCH
    //
    // Valid.
    //
    // Live session = SNATCH
    // Athlete's next attempt = CLEAN_JERK
    //
    // Not valid.
    // -----------------------------------

    if (
        currentAttempt.phase !==
        session.currentPhase
    ) {
        throw new Error(
            `Athlete's next attempt is ${currentAttempt.phase}, but the live session is currently in ${session.currentPhase}.`
        );
    }

    // -----------------------------------
    // Set manually selected athlete
    // as CURRENT ATHLETE
    // -----------------------------------

    session.currentEntryId =
        competitionEntry._id;

    session.status =
        "RUNNING";

    await session.save();

    // -----------------------------------
    // Log selection
    // -----------------------------------

    console.log(
        "===================================="
    );

    console.log(
        "OFFICIAL ATHLETE SELECTED"
    );

    console.log(
        "Competition:",
        competitionId.toString()
    );

    console.log(
        "Gender:",
        normalizedGender
    );

    console.log(
        "Entry:",
        competitionEntry._id.toString()
    );

    console.log(
        "Athlete:",
        competitionEntry
            .athleteId
            ?.personalInfo
            ?.fullName
    );

    console.log(
        "Phase:",
        currentAttempt.phase
    );

    console.log(
        "Attempt:",
        currentAttempt.attemptNo
    );

    console.log(
        "Declared Weight:",
        currentAttempt.declaredWeight
    );

    console.log(
        "Current Entry:",
        session.currentEntryId
            ?.toString()
    );

    console.log(
        "===================================="
    );

    // -----------------------------------
    // Return selected athlete information
    // -----------------------------------

    return {
        session,

        athlete: {
            entryId:
                competitionEntry._id,

            athleteId:
                competitionEntry.athleteId?._id,

            name:
                competitionEntry
                    .athleteId
                    ?.personalInfo
                    ?.fullName,

            gender:
                athleteGender,

            lotNumber:
                competitionEntry
                    .official
                    ?.lotNumber,

            weightCategory:
                competitionEntry
                    .official
                    ?.finalWeightCategory,

            bodyWeight:
                competitionEntry
                    .official
                    ?.bodyWeight,

            openingSnatch:
                competitionEntry
                    .opening
                    ?.snatch,

            openingCleanJerk:
                competitionEntry
                    .opening
                    ?.cleanJerk,

            currentAttempt,

            snatchAttempts:
                competitionEntry
                    .snatchAttempts,

            cleanJerkAttempts:
                competitionEntry
                    .cleanJerkAttempts,

            results:
                competitionEntry
                    .results,
        },
    };
};

export default selectOfficialAthlete;