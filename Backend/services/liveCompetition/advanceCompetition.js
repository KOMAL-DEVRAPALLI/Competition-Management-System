import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";

const advanceCompetition = async (
    competitionId,
    gender
) => {

    const session =
        await LiveCompetition.findOne({
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

    // -----------------------------------
    // Load competition entries
    // -----------------------------------

    const entries =
        await buildWorkingSheetData(
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
    // Check whether an athlete still has
    // a pending attempt in a phase
    // -----------------------------------

    const hasPendingAttemptInPhase = (
        competitionEntry,
        phase
    ) => {

        const attempts =
            phase === "SNATCH"
                ? competitionEntry.snatchAttempts
                : competitionEntry.cleanJerkAttempts;

        return attempts.some(
            (attempt) =>
                attempt.result === "PENDING"
        );
    };

    // -----------------------------------
    // Get athletes with an attempt
    // remaining in the phase
    // -----------------------------------

    const getPendingEntries = (
        phase
    ) => {

        return entries.filter(
            (entry) =>
                hasPendingAttemptInPhase(
                    entry.competitionEntry,
                    phase
                )
        );
    };

    // -----------------------------------
    // Determine PREPARE athlete
    //
    // The athlete who just lifted becomes
    // PREPARE if another attempt remains
    // in the CURRENT phase.
    //
    // IMPORTANT:
    // They do NOT automatically return
    // to the platform.
    // -----------------------------------

    const getPrepareEntryId = (
        entryId
    ) => {

        if (!entryId) {
            return null;
        }

        const entry =
            entries.find(
                (item) =>
                    item.entryId.toString() ===
                    entryId.toString()
            );

        if (!entry) {
            return null;
        }

        const attempt =
            getCurrentAttempt(
                entry.competitionEntry
            );

        if (
            !attempt ||
            attempt.completed ||
            attempt.phase !==
                session.currentPhase
        ) {
            return null;
        }

        return entryId;
    };

    // -----------------------------------
    // Check current phase
    // -----------------------------------

    let pendingEntries =
        getPendingEntries(
            session.currentPhase
        );

    console.log(
        "===================================="
    );

    console.log(
        "ADVANCE COMPETITION"
    );

    console.log(
        "Current Phase:",
        session.currentPhase
    );

    console.log(
        "Previous Current:",
        previousCurrentEntryId
            ?.toString() ?? "NONE"
    );

    console.log(
        "Pending Athletes:",
        pendingEntries.length
    );

    // -----------------------------------
    // Debug athletes
    // -----------------------------------

    entries.forEach((entry) => {

        const attempt =
            getCurrentAttempt(
                entry.competitionEntry
            );

        console.log(
            "ATHLETE:",
            entry.name
        );

        console.log(
            "Entry:",
            entry.entryId.toString()
        );

        console.log(
            "Current Phase:",
            attempt.phase
        );

        console.log(
            "Current Attempt:",
            attempt.attemptNo
        );

        console.log(
            "Declared Weight:",
            attempt.declaredWeight
        );

        console.log(
            "Result:",
            attempt.result
        );

    });

    // -----------------------------------
    // SNATCH PHASE
    // -----------------------------------

    if (
        session.currentPhase ===
        "SNATCH"
    ) {

        // -----------------------------------
        // At least one Snatch attempt remains.
        //
        // Stay in Snatch.
        // -----------------------------------

        if (
            pendingEntries.length > 0
        ) {

            console.log(
                "SNATCH PHASE CONTINUES."
            );

        }

        // -----------------------------------
        // All Snatch attempts completed.
        //
        // Move to Clean & Jerk.
        // -----------------------------------

        else {

            console.log(
                "ALL SNATCH ATTEMPTS COMPLETED."
            );

            console.log(
                "MOVING TO CLEAN & JERK."
            );

            session.currentPhase =
                "CLEAN_JERK";

            pendingEntries =
                getPendingEntries(
                    "CLEAN_JERK"
                );
        }
    }

    // -----------------------------------
    // CLEAN & JERK PHASE
    // -----------------------------------

    else if (
        session.currentPhase ===
        "CLEAN_JERK"
    ) {

        if (
            pendingEntries.length === 0
        ) {

            console.log(
                "ALL CLEAN & JERK ATTEMPTS COMPLETED."
            );

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
    // IMPORTANT STATE RULE
    //
    // After EVERY completed lift:
    //
    // currentEntryId = null
    //
    // We DO NOT automatically select
    // another athlete.
    //
    // The next athlete must be explicitly
    // declared before reaching platform.
    // -----------------------------------

    session.currentEntryId =
        null;

    // -----------------------------------
    // Previous athlete becomes PREPARE
    // only when their next attempt is
    // still in the current phase.
    //
    // If phase changed, this returns null.
    // -----------------------------------

    session.prepareEntryId =
        getPrepareEntryId(
            previousCurrentEntryId
        );

    console.log(
        "===== WAITING FOR NEXT DECLARATION ====="
    );

    console.log(
        "Current Platform:",
        "NONE"
    );

    console.log(
        "Prepare Entry:",
        session.prepareEntryId
            ?.toString() ?? "NONE"
    );

    console.log(
        "Current Phase:",
        session.currentPhase
    );

    console.log(
        "Status:",
        session.status
    );

    // -----------------------------------
    // Persist state
    // -----------------------------------

    await session.save();

    console.log(
        "===== LIVE SESSION SAVED ====="
    );

    console.log(
        "Current Entry AFTER:",
        session.currentEntryId
            ?.toString() ?? "NONE"
    );

    console.log(
        "Prepare Entry AFTER:",
        session.prepareEntryId
            ?.toString() ?? "NONE"
    );

    return session;
};

export default advanceCompetition;