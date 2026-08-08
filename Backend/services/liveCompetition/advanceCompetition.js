import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";
import selectNextAthlete from "./selectNextAthlete.js";

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
    // an incomplete attempt in a phase.
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
    // Get athletes who still have an
    // attempt remaining in this phase.
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
    // Get athletes whose CURRENT attempt
    // is ready for the platform.
    //
    // Attempt 1:
    // Uses opening weight.
    //
    // Attempt 2 / 3:
    // Must have a declared weight.
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

                if (
                    !attempt ||
                    attempt.completed ||
                    attempt.phase !==
                        session.currentPhase
                ) {
                    return false;
                }

                // -----------------------------------
                // Attempt 1
                // -----------------------------------

                if (
                    attempt.attemptNo === 1
                ) {

                    const openingWeight =
                        attempt.phase === "SNATCH"
                            ? entry.openingSnatch
                            : entry.openingCleanJerk;

                    return (
                        openingWeight != null &&
                        openingWeight > 0
                    );

                }

                // -----------------------------------
                // Attempt 2 / 3
                // -----------------------------------

                return (
                    attempt.declaredWeight != null &&
                    attempt.declaredWeight > 0
                );

            }
        );

    };

    // -----------------------------------
    // Determine PREPARE athlete.
    //
    // The previous athlete stays in
    // PREPARE if they still have another
    // attempt in the current phase.
    //
    // They do NOT automatically get the
    // platform. Once they declare, they
    // re-enter the normal competition
    // order.
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
        "PHASE CHECK"
    );

    console.log(
        "Current Phase:",
        session.currentPhase
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
            "Declared At:",
            attempt.declaredAt
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
        // At least one athlete still has a
        // Snatch attempt remaining.
        //
        // Stay in Snatch.
        // -----------------------------------

        if (
            pendingEntries.length > 0
        ) {

            console.log(
                "SNATCH PHASE CONTINUES."
            );

        } else {

            // -----------------------------------
            // Every athlete completed all
            // Snatch attempts.
            // -----------------------------------

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
    // Find athletes ready for platform
    // -----------------------------------

    const eligibleEntries =
        getEligibleEntries(
            pendingEntries
        );

    console.log(
        "===================================="
    );

    console.log(
        "ELIGIBLE ATHLETES:",
        eligibleEntries.length
    );

    eligibleEntries.forEach(
        (entry) => {

            const attempt =
                getCurrentAttempt(
                    entry.competitionEntry
                );

            console.log(
                "ELIGIBLE:",
                entry.name,
                "| Attempt:",
                attempt.attemptNo,
                "| Declared:",
                attempt.declaredWeight,
                "| Opening:",
                attempt.phase === "SNATCH"
                    ? entry.openingSnatch
                    : entry.openingCleanJerk
            );

        }
    );

    // -----------------------------------
    // Nobody is currently ready.
    //
    // Platform becomes empty.
    //
    // Previous athlete goes to Prepare
    // if another attempt remains.
    // -----------------------------------

    if (
        !eligibleEntries.length
    ) {

        session.currentEntryId =
            null;

        session.prepareEntryId =
            getPrepareEntryId(
                previousCurrentEntryId
            );

        console.log(
            "===== WAITING FOR DECLARATION ====="
        );

        console.log(
            "Previous Current:",
            previousCurrentEntryId
                ?.toString()
        );

        console.log(
            "Current Platform: NONE"
        );

        console.log(
            "Prepare Entry:",
            session.prepareEntryId
                ?.toString() ?? "NONE"
        );

        await session.save();

        return session;
    }

    // -----------------------------------
    // IMPORTANT:
    //
    // DO NOT exclude previousCurrentEntryId.
    //
    // If the previous athlete has declared
    // their next attempt, they are now part
    // of the normal competition order.
    //
    // Example:
    //
    // Athlete 1 Attempt 2 = 25 kg
    // Athlete 2 Attempt 1 = 30 kg
    //
    // Athlete 1 must be selected.
    //
    // But:
    //
    // Athlete 1 Attempt 2 = 35 kg
    // Athlete 2 Attempt 1 = 30 kg
    //
    // Athlete 2 must be selected.
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

    const nextAttempt =
        getCurrentAttempt(
            nextAthlete.competitionEntry
        );

    // -----------------------------------
    // Safety check
    // -----------------------------------

    if (
        nextAttempt.phase !==
        session.currentPhase
    ) {

        throw new Error(
            `Phase mismatch. Competition is in ${session.currentPhase}, but selected athlete is in ${nextAttempt.phase}.`
        );

    }

    // -----------------------------------
    // Previous athlete becomes PREPARE
    // if another attempt remains.
    // -----------------------------------

    session.prepareEntryId =
        getPrepareEntryId(
            previousCurrentEntryId
        );

    // -----------------------------------
    // Selected athlete becomes CURRENT
    // -----------------------------------

    session.currentEntryId =
        nextAthlete.entryId;

    console.log(
        "===================================="
    );

    console.log(
        "ADVANCE COMPETITION"
    );

    console.log(
        "Previous Current:",
        previousCurrentEntryId
            ?.toString()
    );

    console.log(
        "Selected Next:",
        nextAthlete.entryId
            .toString()
    );

    console.log(
        "Selected Athlete:",
        nextAthlete.name
    );

    console.log(
        "Selected Phase:",
        nextAttempt.phase
    );

    console.log(
        "Selected Attempt:",
        nextAttempt.attemptNo
    );

    console.log(
        "Selected Declared Weight:",
        nextAttempt.declaredWeight
    );

    console.log(
        "Prepare Entry:",
        session.prepareEntryId
            ?.toString() ?? "NONE"
    );

    console.log(
        "Current Entry:",
        session.currentEntryId
            ?.toString()
    );

    console.log(
        "Current Phase:",
        session.currentPhase
    );

    await session.save();

    return session;
};

export default advanceCompetition;