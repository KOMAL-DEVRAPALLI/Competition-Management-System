import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";
import selectNextAthlete from "./selectNextAthlete.js";

const startLiveCompetition = async ({
    competitionId,
    gender,
    sessionName = "",
    selectedWeightCategories = [],
}) => {

    let entries =
        await buildWorkingSheetData(
            competitionId,
            gender,
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
        gender,
    });

    // -----------------------------------
    // Find athletes who can start
    // in Snatch
    // -----------------------------------

    const eligibleEntries =
        entries.filter((athlete) => {

            const attempt =
                getCurrentAttempt(
                    athlete.competitionEntry
                );

            return (
                !attempt.completed &&
                attempt.phase === "SNATCH"
            );

        });

    // -----------------------------------
    // Select first athlete
    // -----------------------------------

    const firstAthlete =
        selectNextAthlete(
            eligibleEntries
        );

    if (!firstAthlete) {
        throw new Error(
            "Unable to determine first athlete."
        );
    }

    console.log(
        "===== FIRST ATHLETE SELECTED ====="
    );

    console.log(
        "Entry ID:",
        firstAthlete.entryId?.toString()
    );

    console.log(
        "Name:",
        firstAthlete.name
    );

    console.log(
        "Lot Number:",
        firstAthlete.lotNumber
    );

    console.log(
        "Phase:",
        getCurrentAttempt(
            firstAthlete.competitionEntry
        ).phase
    );

    console.log(
        "Attempt:",
        getCurrentAttempt(
            firstAthlete.competitionEntry
        ).attemptNo
    );

    // -----------------------------------
    // Create live competition session
    // -----------------------------------

    const session =
        await LiveCompetition.create({

            competitionId,

            gender,

            sessionName,

            selectedWeightCategories,

            currentEntryId:
                firstAthlete.entryId,

            prepareEntryId: null,

            currentPhase:
                "SNATCH",

            status: "READY",

        });

    // -----------------------------------
    // Verify created Mongoose document
    // -----------------------------------

    console.log(
        "===== LIVE SESSION CREATED ====="
    );

    console.log(
        "Session ID:",
        session._id.toString()
    );

    console.log(
        "Created Current Entry ID:",
        session.currentEntryId?.toString()
    );

    console.log(
        "Created Prepare Entry ID:",
        session.prepareEntryId?.toString()
    );

    console.log(
        "Created Phase:",
        session.currentPhase
    );

    // -----------------------------------
    // Verify actual MongoDB document
    // -----------------------------------

    const savedSession =
        await LiveCompetition.findById(
            session._id
        );

    console.log(
        "===== LIVE SESSION FROM DATABASE ====="
    );

    console.log(
        "DB Session ID:",
        savedSession?._id?.toString()
    );

    console.log(
        "DB Current Entry ID:",
        savedSession?.currentEntryId?.toString()
    );

    console.log(
        "DB Prepare Entry ID:",
        savedSession?.prepareEntryId?.toString()
    );

    console.log(
        "DB Current Phase:",
        savedSession?.currentPhase
    );

    // -----------------------------------
    // Map athlete for response
    // -----------------------------------

    const mapAthlete = (athlete) => ({

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
    // Find current athlete
    // -----------------------------------

    const currentAthlete =
        entries.find(
            (athlete) =>
                athlete.entryId.toString() ===
                session.currentEntryId.toString()
        );

    // -----------------------------------
    // Build declaration queue
    // -----------------------------------

    const queue =
        entries
            .filter((athlete) => {

                if (
                    athlete.entryId.toString() ===
                    session.currentEntryId.toString()
                ) {
                    return false;
                }

                const attempt =
                    getCurrentAttempt(
                        athlete.competitionEntry
                    );

                return (
                    !attempt.completed &&
                    attempt.declaredWeight != null
                );

            })
            .map(mapAthlete);

    // -----------------------------------
    // Return session
    // -----------------------------------

    return {

        session,

        currentAthlete:
            currentAthlete
                ? mapAthlete(
                      currentAthlete
                  )
                : null,

        queue,

        totalAthletes:
            entries.length,

    };

};

export default startLiveCompetition;