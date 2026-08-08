import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";

const startLiveCompetition = async ({
    competitionId,
    gender,
    sessionName = "",
    selectedWeightCategories = [],
}) => {

    // -----------------------------------
    // Validate input
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

    const normalizedGender =
        gender.toLowerCase();

    // -----------------------------------
    // Get competition entries
    // -----------------------------------

    let entries =
        await buildWorkingSheetData(
            competitionId,
            normalizedGender,
            true
        );

    console.log(
        "===== START LIVE COMPETITION ====="
    );

    console.log(
        "Competition ID:",
        competitionId.toString()
    );

    console.log(
        "Gender:",
        normalizedGender
    );

    console.log(
        "Selected Categories:",
        selectedWeightCategories
    );

    console.log(
        "Total Entries Before Filter:",
        entries.length
    );

    // -----------------------------------
    // Filter selected weight categories
    // -----------------------------------

    if (
        Array.isArray(
            selectedWeightCategories
        ) &&
        selectedWeightCategories.length > 0
    ) {

        entries =
            entries.filter(
                (athlete) =>
                    selectedWeightCategories.includes(
                        athlete.weightCategory
                    )
            );

    }

    console.log(
        "Total Entries After Filter:",
        entries.length
    );

    // -----------------------------------
    // Make sure athletes exist
    // -----------------------------------

    if (!entries.length) {
        throw new Error(
            "No athletes found for this session."
        );
    }

    // -----------------------------------
    // Verify that the session contains
    // athletes who can compete in SNATCH.
    //
    // IMPORTANT:
    //
    // We DO NOT select anyone here.
    // -----------------------------------

    const eligibleEntries =
        entries.filter(
            (athlete) => {

                const attempt =
                    getCurrentAttempt(
                        athlete.competitionEntry
                    );

                return (
                    !attempt.completed &&
                    attempt.phase ===
                        "SNATCH"
                );

            }
        );

    if (!eligibleEntries.length) {
        throw new Error(
            "No athletes are available to start the Snatch session."
        );
    }

    console.log(
        "Eligible Snatch Athletes:",
        eligibleEntries.length
    );

    // -----------------------------------
    // Remove existing live session
    // -----------------------------------

    await LiveCompetition.deleteMany({
        competitionId,
        gender: normalizedGender,
    });

    // -----------------------------------
    // CREATE NEW SESSION
    //
    // IMPORTANT:
    //
    // currentEntryId = null
    //
    // Nobody is automatically placed
    // on the platform.
    //
    // The official must manually select
    // the first athlete.
    // -----------------------------------

    const session =
        await LiveCompetition.create({

            competitionId,

            gender:
                normalizedGender,

            sessionName,

            selectedWeightCategories,

            currentEntryId:
                null,

            prepareEntryId:
                null,

            currentPhase:
                "SNATCH",

            status:
                "READY",

        });

    // -----------------------------------
    // Verify database state
    // -----------------------------------

    console.log(
        "===== LIVE SESSION CREATED ====="
    );

    console.log(
        "Session ID:",
        session._id.toString()
    );

    console.log(
        "Current Entry:",
        session.currentEntryId
            ?.toString() ?? "NONE"
    );

    console.log(
        "Prepare Entry:",
        session.prepareEntryId
            ?.toString() ?? "NONE"
    );

    console.log(
        "Phase:",
        session.currentPhase
    );

    console.log(
        "Status:",
        session.status
    );

    // -----------------------------------
    // Build response athlete mapper
    // -----------------------------------

    const mapAthlete = (
        athlete
    ) => {

        const currentAttempt =
            getCurrentAttempt(
                athlete.competitionEntry
            );

        return {

            entryId:
                athlete.entryId,

            athleteId:
                athlete.athleteId,

            name:
                athlete.name,

            registrationNo:
                athlete.registrationNo,

            lotNumber:
                athlete.lotNumber,

            event:
                athlete.isYouth
                    ? "Y"
                    : athlete.isJunior
                    ? "J"
                    : athlete.isSenior
                    ? "S"
                    : "",

            bodyWeight:
                athlete.bodyWeight,

            weightCategory:
                athlete.weightCategory,

            openingSnatch:
                athlete.openingSnatch,

            openingCleanJerk:
                athlete.openingCleanJerk,

            bestSnatch:
                athlete.bestSnatch,

            bestCleanJerk:
                athlete.bestCleanJerk,

            total:
                athlete.total,

            place:
                athlete.place,

            status:
                "AVAILABLE",

            currentAttempt,

            snatchAttempts:
                athlete
                    .competitionEntry
                    .snatchAttempts,

            cleanJerkAttempts:
                athlete
                    .competitionEntry
                    .cleanJerkAttempts,

            competitionEntry:
                athlete.competitionEntry,

        };

    };

    // -----------------------------------
    // Build complete athlete list
    //
    // This is NOT an automatic queue.
    //
    // It is simply the list available
    // to the official for manual selection.
    // -----------------------------------

    const athleteList =
        entries.map(
            mapAthlete
        );

    // -----------------------------------
    // IMPORTANT:
    //
    // No current athlete.
    // No next athlete.
    // No automatic selection.
    // -----------------------------------

    return {

        session,

        currentAthlete:
            null,

        declarationQueue:
            [],

        athletes:
            athleteList,

        totalAthletes:
            entries.length,

    };

};

export default startLiveCompetition;

