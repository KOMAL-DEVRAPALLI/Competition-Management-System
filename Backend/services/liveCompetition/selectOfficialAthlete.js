import CompetitionEntry from "../../models/CompetitionEntry.js";
import LiveCompetition from "../../models/LiveCompetition.js";
import getCurrentAttempt from "./getCurrentAttempt.js";


const selectOfficialAthlete = async ({
    competitionId,
    gender,
    entryId,
    expectedStateVersion,
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


    // =====================================
    // VALIDATE EXPECTED STATE VERSION
    // =====================================

    if (
        !Number.isInteger(
            expectedStateVersion
        ) ||
        expectedStateVersion < 0
    ) {

        throw new Error(
            "expectedStateVersion must be a non-negative integer."
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
    // VALIDATE AUTHORITATIVE STATE VERSION
    // =====================================

    if (
        !Number.isInteger(
            session.stateVersion
        ) ||
        session.stateVersion < 0
    ) {

        throw new Error(
            "Live competition stateVersion is invalid. Recovery required."
        );

    }


    if (
        expectedStateVersion !==
        session.stateVersion
    ) {

        const error =
            new Error(
                "Live competition state has changed. Refresh before selecting another athlete."
            );

        error.code =
            "STALE_STATE";

        error.statusCode =
            409;

        error.expectedStateVersion =
            expectedStateVersion;

        error.currentStateVersion =
            session.stateVersion;

        throw error;

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
    // Existing behavior preserved.
    // =====================================

    session.currentEntryId =
        competitionEntry._id;


    session.status =
        "RUNNING";


    // =====================================
    // AUTHORITATIVE STATE VERSION
    //
    // Athlete selection is a state-changing
    // transition, therefore the version
    // advances only after all validation
    // above has succeeded.
    // =====================================

    session.stateVersion =
        session.stateVersion + 1;


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
        "State Version:",
        session.stateVersion
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

        stateVersion:
            session.stateVersion,

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