import LiveCompetition from "../../models/LiveCompetition.js";
import CompetitionEntry from "../../models/CompetitionEntry.js";
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
    // IMPORTANT
    //
    // Determine whether an athlete still
    // has an attempt remaining IN THIS
    // COMPETITION PHASE.
    //
    // Do NOT use getCurrentAttempt()
    // for this decision.
    //
    // getCurrentAttempt() is allowed to
    // return CLEAN_JERK Attempt 1 after
    // all Snatch attempts are completed.
    // That does NOT mean the Snatch phase
    // itself is finished for everybody.
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
    // incomplete attempt in THIS phase
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
    // has been declared and is therefore
    // ready for the platform.
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
    // Check current competition phase
    // -----------------------------------

    let pendingEntries =
        getPendingEntries(
            session.currentPhase
        );

    console.log(
        "===== CHECK PHASE ====="
    );

    console.log(
        "Current Phase:",
        session.currentPhase
    );

    console.log(
        "Athletes Remaining In Phase:",
        pendingEntries.length
    );

    // -----------------------------------
    // Move to Clean & Jerk ONLY when
    // EVERY athlete has completed all
    // Snatch attempts.
    // -----------------------------------

    if (!pendingEntries.length) {

        if (
            session.currentPhase ===
            "SNATCH"
        ) {

            console.log(
                "===== SNATCH COMPLETED ====="
            );

            session.currentPhase =
                "CLEAN_JERK";

            pendingEntries =
                getPendingEntries(
                    "CLEAN_JERK"
                );

            console.log(
                "Moving competition to CLEAN_JERK."
            );

        } else {

            // -----------------------------------
            // Both phases completed
            // -----------------------------------

            console.log(
                "===== COMPETITION FINISHED ====="
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
        "Eligible Athletes:",
        eligibleEntries.length
    );

    // -----------------------------------
    // Nobody has declared the next
    // attempt yet.
    //
    // Keep platform empty and move the
    // previous athlete to Prepare.
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
    // Select next athlete
    //
    // Ordering is based on:
    //
    // 1. Declared weight
    // 2. Attempt number
    // 3. Declaration time
    // 4. Lot number
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
    // Previous athlete becomes Prepare
    // -----------------------------------

    session.prepareEntryId =
        previousCurrentEntryId;

    // -----------------------------------
    // Selected athlete becomes Current
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