import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";
import selectNextAthlete from "./selectNextAthlete.js";

const advanceCompetition = async (
    competitionId,
    gender
) => {

    const session = await LiveCompetition.findOne({
        competitionId,
        gender,
    });

    if (!session) {
        throw new Error(
            "Live competition session not found."
        );
    }

    // -----------------------------------
    // Athlete who just completed the lift
    // -----------------------------------

    const previousCurrentEntryId =
        session.currentEntryId;

    const entries = await buildWorkingSheetData(
        competitionId,
        gender,
        true,
        session.selectedWeightCategories
    );

    if (!entries.length) {
        throw new Error(
            "No athletes found."
        );
    }

    // -----------------------------------
    // Get athletes who still have an
    // incomplete attempt in this phase
    // -----------------------------------

    const getPendingEntries = (phase) => {

        return entries.filter((entry) => {

            const attempt =
                getCurrentAttempt(
                    entry.competitionEntry
                );

            return (
                !attempt.completed &&
                attempt.phase === phase
            );

        });

    };

    // -----------------------------------
    // Current competition phase
    // -----------------------------------

    let pendingEntries =
        getPendingEntries(
            session.currentPhase
        );

    // -----------------------------------
    // Move to Clean & Jerk ONLY after
    // every Snatch attempt is completed
    // -----------------------------------

    if (!pendingEntries.length) {

        if (
            session.currentPhase ===
            "SNATCH"
        ) {

            session.currentPhase =
                "CLEAN_JERK";

            pendingEntries =
                getPendingEntries(
                    "CLEAN_JERK"
                );

        } else {

            // -----------------------------------
            // Both phases are completed
            // -----------------------------------

            session.status =
                "FINISHED";

            session.currentEntryId =
                null;

            session.prepareEntryId =
                null;

            await session.save();

            return session;
        }
    }

    // -----------------------------------
    // Find athletes whose current attempt
    // has already been declared.
    //
    // IMPORTANT:
    // Exclude the athlete who just lifted.
    // That athlete must not immediately
    // become the next platform athlete.
    // -----------------------------------

    const eligibleEntries =
        pendingEntries.filter(
            (entry) => {

                const attempt =
                    getCurrentAttempt(
                        entry.competitionEntry
                    );

                const isPreviousAthlete =
                    previousCurrentEntryId &&
                    entry.entryId.toString() ===
                        previousCurrentEntryId.toString();

                return (
                    !isPreviousAthlete &&
                    attempt.declaredWeight != null
                );

            }
        );

    // -----------------------------------
    // Nobody else is ready.
    //
    // The athlete who just lifted moves
    // to Prepare.
    // -----------------------------------

    if (!eligibleEntries.length) {

        session.currentEntryId =
            null;

        session.prepareEntryId =
            previousCurrentEntryId;

        console.log(
            "===== WAITING FOR DECLARATION ====="
        );

        console.log(
            "Previous Current:",
            previousCurrentEntryId?.toString()
        );

        console.log(
            "Current Platform: NONE"
        );

        console.log(
            "Prepare Athlete:",
            session.prepareEntryId?.toString()
        );

        await session.save();

        return session;
    }

    // -----------------------------------
    // Select next athlete according to
    // competition ordering
    // -----------------------------------

    const nextAthlete =
        selectNextAthlete(
            eligibleEntries
        );

    if (!nextAthlete) {

        throw new Error(
            "Unable to determine next athlete."
        );

    }

    // -----------------------------------
    // Athlete who just lifted moves
    // to Prepare
    // -----------------------------------

    session.prepareEntryId =
        previousCurrentEntryId;

    // -----------------------------------
    // Next eligible athlete becomes
    // the platform athlete
    // -----------------------------------

    session.currentEntryId =
        nextAthlete.entryId;

    console.log(
        "===== ADVANCE COMPETITION ====="
    );

    console.log(
        "Previous Current:",
        previousCurrentEntryId?.toString()
    );

    console.log(
        "New Current:",
        nextAthlete.entryId.toString()
    );

    console.log(
        "Prepare Entry:",
        session.prepareEntryId?.toString()
    );

    console.log(
        "Current Entry:",
        session.currentEntryId?.toString()
    );

    console.log(
        "Current Phase:",
        session.currentPhase
    );

    await session.save();

    return session;
};

export default advanceCompetition;