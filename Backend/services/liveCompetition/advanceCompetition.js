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
    // Get athletes with an incomplete
    // attempt in the current phase
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
    // Get athletes whose current attempt
    // has already been declared
    // -----------------------------------

    const getEligibleEntries = (
        pendingEntries
    ) => {

        return pendingEntries.filter(
            (entry) => {

                const attempt =
                    getCurrentAttempt(
                        entry.competitionEntry
                    );

                return (
                    attempt.declaredWeight != null
                );

            }
        );

    };

    // -----------------------------------
    // Check current phase
    // -----------------------------------

    let pendingEntries =
        getPendingEntries(
            session.currentPhase
        );

    // -----------------------------------
    // Move to Clean & Jerk ONLY when
    // all Snatch attempts are completed
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
            // Both phases completed
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
    // Find all athletes ready for the
    // platform.
    //
    // The athlete who just lifted is NOT
    // automatically excluded.
    //
    // If their next attempt is already
    // declared, they can be selected again.
    // -----------------------------------

    const eligibleEntries =
        getEligibleEntries(
            pendingEntries
        );

    // -----------------------------------
    // Nobody has declared an attempt.
    // Platform remains empty.
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
    // competition ordering.
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

    const nextEntryId =
        nextAthlete.entryId.toString();

    const previousEntryId =
        previousCurrentEntryId
            ?.toString();

    // -----------------------------------
    // Determine whether the same athlete
    // is returning for another attempt.
    // -----------------------------------

    const sameAthlete =
        previousEntryId &&
        nextEntryId === previousEntryId;

    // -----------------------------------
    // If the same athlete is returning,
    // they are CURRENT only.
    //
    // They must NOT also be PREPARE.
    // -----------------------------------

    if (sameAthlete) {

        session.prepareEntryId =
            null;

        session.currentEntryId =
            nextAthlete.entryId;

        console.log(
            "===== SAME ATHLETE NEXT ATTEMPT ====="
        );

        console.log(
            "Athlete:",
            nextAthlete.entryId.toString()
        );

    } else {

        // -----------------------------------
        // Different athlete is going next.
        //
        // Previous athlete moves to Prepare.
        // -----------------------------------

        session.prepareEntryId =
            previousCurrentEntryId;

        session.currentEntryId =
            nextAthlete.entryId;

        console.log(
            "===== DIFFERENT ATHLETE ====="
        );

        console.log(
            "Previous Current:",
            previousCurrentEntryId?.toString()
        );

        console.log(
            "New Current:",
            nextAthlete.entryId.toString()
        );

    }

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