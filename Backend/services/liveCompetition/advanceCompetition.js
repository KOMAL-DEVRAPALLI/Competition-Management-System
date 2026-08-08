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
    //
    // IMPORTANT:
    // We do NOT use getCurrentAttempt()
    // for this phase-completion check.
    //
    // getCurrentAttempt() can return
    // CLEAN_JERK 1 after an athlete
    // finishes all Snatch attempts.
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
    // Get all athletes who still have
    // an attempt remaining in this phase.
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
    // is declared and ready.
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
            // Attempt 1:
            // Opening weight automatically makes
            // the athlete eligible.
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
            // Attempt 2 / 3:
            // Must have an explicit declaration.
            // -----------------------------------

            return (
                attempt.declaredWeight != null &&
                attempt.declaredWeight > 0
            );

        }
    );

};

    // -----------------------------------
    // Determine whether the athlete who
    // just lifted can become PREPARE.
    //
    // PREPARE is only valid when the
    // athlete's next attempt belongs
    // to the CURRENT competition phase.
    //
    // Example:
    //
    // SNATCH 1 → GOOD
    // Next = SNATCH 2
    // → PREPARE = athlete
    //
    // SNATCH 2 → GOOD
    // Next = SNATCH 3
    // → PREPARE = athlete
    //
    // SNATCH 3 → GOOD
    // Next = CLEAN_JERK 1
    // Current phase = SNATCH
    // → PREPARE = null
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
    // Check current competition phase
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
    // Debug every athlete
    // -----------------------------------

    entries.forEach((entry) => {

        const snatchPending =
            hasPendingAttemptInPhase(
                entry.competitionEntry,
                "SNATCH"
            );

        const cleanJerkPending =
            hasPendingAttemptInPhase(
                entry.competitionEntry,
                "CLEAN_JERK"
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
            "Snatch Pending:",
            snatchPending
        );

        console.log(
            "Clean & Jerk Pending:",
            cleanJerkPending
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
        // If even ONE athlete still has a
        // pending Snatch attempt, remain
        // in SNATCH.
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
            pendingEntries.length ===
            0
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
    // Find athletes whose CURRENT attempt
    // is declared and ready.
    // -----------------------------------

    const eligibleEntries =
        getEligibleEntries(
            pendingEntries
        );

    console.log(
        "Eligible Athletes:",
        eligibleEntries.length
    );

    // -----------------------------------
    // Nobody has declared yet.
    //
    // Keep platform empty.
    //
    // IMPORTANT:
    // Do NOT assign nextAthlete here.
    // It does not exist yet.
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
            "Current Phase:",
            session.currentPhase
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
            "Prepare Athlete:",
            session.prepareEntryId
                ?.toString() ?? "NONE"
        );

        await session.save();

        return session;
    }

    // -----------------------------------
    // Select next athlete.
    //
    // eligibleEntries contains only
    // athletes from the CURRENT phase.
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
    //
    // Never allow a different phase
    // onto the platform.
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
    // only if their next attempt is
    // still inside the current phase.
    // -----------------------------------

    session.prepareEntryId =
        getPrepareEntryId(
            previousCurrentEntryId
        );

    // -----------------------------------
    // Selected athlete becomes CURRENT.
    // -----------------------------------

    session.currentEntryId =
        nextAthlete.entryId;

    console.log(
        "===== ADVANCE COMPETITION ====="
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
        "Selected Weight:",
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