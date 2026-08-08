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
    // Normalize gender
    // -----------------------------------

    const normalizedGender =
        gender.toLowerCase();

    // -----------------------------------
    // Build working sheet
    // -----------------------------------

    let entries =
        await buildWorkingSheetData(
            competitionId,
            normalizedGender,
            true
        );

    console.log(
        "Selected Categories:",
        selectedWeightCategories
    );

    console.log(
        "Before Filter:",
        entries.map((athlete) => ({
            name: athlete.name,
            category: athlete.weightCategory,
        }))
    );

    // -----------------------------------
    // Filter selected weight categories
    // -----------------------------------

    if (
        selectedWeightCategories.length > 0
    ) {

        entries = entries.filter(
            (athlete) =>
                selectedWeightCategories.includes(
                    athlete.weightCategory
                )
        );

    }

    console.log(
        "After Filter:",
        entries.map((athlete) => ({
            name: athlete.name,
            category: athlete.weightCategory,
        }))
    );

    // -----------------------------------
    // Validate athletes
    // -----------------------------------

    if (!entries.length) {

        throw new Error(
            "No athletes found for this session."
        );

    }

    // -----------------------------------
    // Remove previous live session
    // -----------------------------------

    await LiveCompetition.deleteMany({

        competitionId,

        gender:
            normalizedGender,

    });

    // -----------------------------------
    // CREATE NEW LIVE SESSION
    //
    // IMPORTANT:
    //
    // NO ATHLETE IS SELECTED HERE.
    //
    // The official must manually select
    // the athlete.
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
    // Verify created session
    // -----------------------------------

    console.log(
        "===================================="
    );

    console.log(
        "LIVE COMPETITION CREATED"
    );

    console.log(
        "Session ID:",
        session._id.toString()
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
        "Current Entry:",
        session.currentEntryId
            ?.toString() ??
            "NONE"
    );

    console.log(
        "Prepare Entry:",
        session.prepareEntryId
            ?.toString() ??
            "NONE"
    );

    console.log(
        "Current Phase:",
        session.currentPhase
    );

    console.log(
        "Status:",
        session.status
    );

    console.log(
        "Total Athletes:",
        entries.length
    );

    console.log(
        "===================================="
    );

    // -----------------------------------
    // Map athlete
    // -----------------------------------

    const mapAthlete = (
        athlete
    ) => ({

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

        currentAttempt:
            getCurrentAttempt(
                athlete.competitionEntry
            ),

        snatchAttempts:
            athlete.competitionEntry
                .snatchAttempts,

        cleanJerkAttempts:
            athlete.competitionEntry
                .cleanJerkAttempts,

        competitionEntry:
            athlete.competitionEntry,

    });

    // -----------------------------------
    // No current athlete at startup
    // -----------------------------------

    const currentAthlete =
        null;

    // -----------------------------------
    // IMPORTANT
    //
    // Declaration queue is no longer
    // used for automatic athlete
    // selection.
    //
    // Officials manually select from
    // the complete athlete list.
    // -----------------------------------

    const queue = [];

    // -----------------------------------
    // Return session
    // -----------------------------------

    return {

        session,

        currentAthlete,

        queue,

        totalAthletes:
            entries.length,

        athletes:
            entries.map(
                mapAthlete
            ),

    };
};

export default startLiveCompetition;