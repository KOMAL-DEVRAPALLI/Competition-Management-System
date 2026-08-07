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

    // Athlete who has just completed the lift
    const previousCurrentEntryId =
        session.currentEntryId;

    const entries = await buildWorkingSheetData(
        competitionId,
        gender,
        true,
        session.selectedWeightCategories
    );

    if (!entries.length) {
        throw new Error("No athletes found.");
    }

    const getPendingEntries = (phase) => {

        return entries.filter((entry) => {

            const attempt = getCurrentAttempt(
                entry.competitionEntry
            );

            return (
                !attempt.completed &&
                attempt.phase === phase
            );

        });

    };

    const getEligibleEntries = (pendingEntries) => {

        return pendingEntries.filter((entry) => {

            const attempt = getCurrentAttempt(
                entry.competitionEntry
            );

            return (
                attempt.declaredWeight != null
            );

        });

    };

    // -----------------------------------
    // Check current phase
    // -----------------------------------

    let pendingEntries =
        getPendingEntries(
            session.currentPhase
        );

    // Move to Clean & Jerk ONLY if every
    // snatch attempt has been completed.
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

    const eligibleEntries =
        getEligibleEntries(
            pendingEntries
        );

    // Nobody is ready.
    // Wait for declarations.
    if (!eligibleEntries.length) {

        session.currentEntryId =
            null;

        session.prepareEntryId =
            previousCurrentEntryId;

        console.log(
            "No athlete is ready for the platform."
        );

        console.log(
            "prepareEntryId:",
            session.prepareEntryId?.toString()
        );

        await session.save();

        return session;

    }

    const nextAthlete =
        selectNextAthlete(
            eligibleEntries,
            previousCurrentEntryId
        );

    if (!nextAthlete) {

        throw new Error(
            "Unable to determine next athlete."
        );

    }

    // Athlete who just lifted
    session.prepareEntryId =
        previousCurrentEntryId;

    // Athlete now on platform
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
        "prepareEntryId:",
        session.prepareEntryId?.toString()
    );

    console.log(
        "currentEntryId:",
        session.currentEntryId?.toString()
    );

    await session.save();

    return session;

};

export default advanceCompetition;