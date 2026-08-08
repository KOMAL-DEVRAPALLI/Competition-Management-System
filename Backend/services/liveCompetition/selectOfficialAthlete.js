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
    // PREVENT SELECTING THE SAME ATHLETE
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
    // CHECK CURRENT ATHLETE
    //
    // IMPORTANT:
    //
    // The current athlete may remain on
    // the platform after GOOD / NO_LIFT.
    //
    // Another athlete may be selected only
    // when the current athlete does NOT
    // require an undeclared attempt in the
    // current live phase.
    // =====================================

    if (session.currentEntryId) {

        const currentEntry =
            await CompetitionEntry.findOne({
                _id:
                    session.currentEntryId,

                competitionId,
            });

        if (!currentEntry) {

            // ---------------------------------
            // Stale platform reference.
            //
            // Safe to clear it.
            // ---------------------------------

            session.currentEntryId =
                null;

            await session.save();

        } else {

            const currentAthleteAttempt =
                getCurrentAttempt(
                    currentEntry
                );

            // ---------------------------------
            // CURRENT ATHLETE COMPLETED
            //
            // Nothing more to declare.
            //
            // Another athlete may be selected.
            // ---------------------------------

            if (
                currentAthleteAttempt.completed
            ) {

                // Selection allowed.

            }

            // ---------------------------------
            // CURRENT ATHLETE'S NEXT ATTEMPT
            // BELONGS TO ANOTHER PHASE
            //
            // Example:
            //
            // Live phase = SNATCH
            // Current athlete next = CLEAN_JERK
            //
            // The athlete has finished Snatch.
            //
            // Another Snatch athlete may now
            // be selected.
            // ---------------------------------

            else if (
                currentAthleteAttempt.phase !==
                session.currentPhase
            ) {

                // Selection allowed.

            }

            // ---------------------------------
            // CURRENT ATHLETE STILL HAS AN
            // ATTEMPT IN THE CURRENT PHASE
            // ---------------------------------

            else {

                const declaredWeight =
                    currentAthleteAttempt
                        .declaredWeight;

                // ---------------------------------
                // NEXT ATTEMPT NOT DECLARED
                //
                // BLOCK selection.
                // ---------------------------------

                if (
                    declaredWeight == null ||
                    Number(declaredWeight) <= 0
                ) {

                    throw new Error(
                        "Declare the current athlete's next attempt before selecting another athlete."
                    );
                }

                // ---------------------------------
                // DECLARATION EXISTS
                //
                // Selection is allowed.
                // ---------------------------------

            }
        }
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
    // GET ATHLETE'S NEXT ATTEMPT
    //
    // The official chooses the athlete.
    //
    // The system determines:
    //
    // S1 / S2 / S3
    // CJ1 / CJ2 / CJ3
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
    // VERIFY CURRENT COMPETITION PHASE
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
    // SELECT ATHLETE
    //
    // THIS IS ALWAYS MANUAL.
    //
    // NO automatic athlete selection.
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