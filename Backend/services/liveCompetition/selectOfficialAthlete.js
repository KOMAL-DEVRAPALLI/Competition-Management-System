import CompetitionEntry from "../../models/CompetitionEntry.js";
import LiveCompetition from "../../models/LiveCompetition.js";
import getCurrentAttempt from "./getCurrentAttempt.js";


const selectOfficialAthlete = async ({
    competitionId,
    gender,
    entryId,
}) => {

    // =====================================
    // VALIDATE REQUIRED DATA
    // =====================================

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


    // =====================================
    // FIND LIVE COMPETITION SESSION
    // =====================================

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


    // =====================================
    // FIND ATHLETE TO BE SELECTED
    // =====================================

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


    // =====================================
    // PREVENT SELECTING SAME ATHLETE
    // =====================================

    if (
        session.currentEntryId &&
        session.currentEntryId
            .toString() ===
        competitionEntry._id
            .toString()
    ) {

        throw new Error(
            "This athlete is already selected."
        );

    }


    // =====================================
    // IMPORTANT:
    //
    // CURRENT ATHLETE DOES NOT BLOCK
    // MANUAL ATHLETE SELECTION.
    //
    // The current athlete may have:
    //
    // - undeclared attempt
    // - declared attempt
    // - pending Snatch attempt
    // - pending Clean & Jerk attempt
    //
    // The official may still select
    // another athlete.
    //
    // We DO NOT:
    //
    // - delete the current attempt
    // - reset the declaration
    // - mark the attempt completed
    // - give GOOD / NO_LIFT
    // - modify CompetitionEntry
    //
    // We only change:
    //
    // session.currentEntryId
    //
    // This means:
    //
    // A = C&J 1 = 40 kg = PENDING
    //
    // Official selects E
    //
    // A remains:
    //
    // C&J 1 = 40 kg = PENDING
    //
    // =====================================


    // =====================================
    // VERIFY SELECTED ATHLETE GENDER
    // =====================================

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


    // =====================================
    // GET SELECTED ATHLETE'S NEXT ATTEMPT
    //
    // The official chooses the athlete.
    //
    // The system determines the athlete's
    // next pending attempt.
    // =====================================

    const currentAttempt =
        getCurrentAttempt(
            competitionEntry
        );


    // =====================================
    // ATHLETE COMPLETED
    // =====================================

    if (
        currentAttempt.completed
    ) {

        throw new Error(
            "Athlete has already completed the competition."
        );

    }


    // =====================================
    // VERIFY SELECTED ATHLETE'S PHASE
    //
    // IMPORTANT:
    //
    // This check applies to the ATHLETE
    // BEING SELECTED.
    //
    // It does NOT apply to the athlete
    // currently leaving the platform.
    //
    // Example:
    //
    // Live phase = SNATCH
    //
    // Current athlete A:
    // C&J 1
    //
    // Selected athlete E:
    // SNATCH 2
    //
    // E can be selected.
    //
    // A's C&J remains untouched.
    // =====================================

    if (
        currentAttempt.phase !==
        session.currentPhase
    ) {

        throw new Error(
            `Athlete's next attempt is ${currentAttempt.phase}, but the live session is currently in ${session.currentPhase}.`
        );

    }


    // =====================================
    // MANUAL ATHLETE SELECTION
    //
    // THIS IS THE ONLY PLATFORM STATE
    // THAT CHANGES.
    //
    // NO AUTOMATIC SELECTION.
    // =====================================

    session.currentEntryId =
        competitionEntry._id;


    session.status =
        "RUNNING";


    await session.save();


    // =====================================
    // LOG SELECTION
    // =====================================

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
        competitionEntry
            ._id
            .toString()
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


    // =====================================
    // RETURN SELECTED ATHLETE
    // =====================================

    return {

        session,

        athlete: {

            entryId:
                competitionEntry._id,

            athleteId:
                competitionEntry
                    .athleteId
                    ?._id,

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