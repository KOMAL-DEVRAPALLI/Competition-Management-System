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

                return (
                    !attempt.completed &&
                    attempt.phase ===
                        session.currentPhase &&
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
    // DEBUG EVERY ATHLETE
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
        // IMPORTANT:
        //
        // If even ONE athlete still has a
        // pending Snatch attempt, we MUST
        // remain in SNATCH.
        // -----------------------------------

        if (pendingEntries.length > 0) {

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
    // Keep the platform empty.
    // -----------------------------------

    if (
        !eligibleEntries.length
    ) {

        session.currentEntryId =
            null;

        session.prepareEntryId =
            previousCurrentEntryId;

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
                ?.toString()
        );

        await session.save();

        return session;

    }

    // -----------------------------------
    // Select next athlete.
    //
    // Because eligibleEntries was built
    // from pendingEntries of the CURRENT
    // phase, a Clean & Jerk athlete can
    // never be selected while Snatch is
    // still active.
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
    // Never allow a phase mismatch.
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
    // Previous athlete becomes Prepare.
    // -----------------------------------

    session.prepareEntryId =
        previousCurrentEntryId;

    // -----------------------------------
    // Selected athlete becomes Current.
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
            ?.toString()
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