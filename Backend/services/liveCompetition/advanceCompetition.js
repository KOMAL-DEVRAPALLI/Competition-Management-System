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

    // -----------------------------------
    // Get current competition entries
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
    // a pending attempt in a phase.
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
    // IMPORTANT
    //
    // After a lift is completed, an
    // athlete is eligible for the
    // platform ONLY when their current
    // attempt has a declaration.
    //
    // We DO NOT use opening weight here.
    //
    // Opening weight is only used by
    // startLiveCompetition.js for the
    // initial athlete.
    //
    // Therefore:
    //
    // Attempt 1 + declaredWeight null
    //      => NOT READY
    //
    // Attempt 1 + declaredWeight 30
    //      => READY
    //
    // Attempt 2 + declaredWeight null
    //      => NOT READY
    //
    // Attempt 2 + declaredWeight 35
    //      => READY
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

                const eligible =
                    attempt.declaredWeight != null &&
                    attempt.declaredWeight > 0;

                console.log(
                    "ELIGIBILITY CHECK:",
                    entry.name,
                    "| Phase:",
                    attempt.phase,
                    "| Attempt:",
                    attempt.attemptNo,
                    "| Declared:",
                    attempt.declaredWeight,
                    "| Eligible:",
                    eligible
                );

                return eligible;
            }
        );
    };

    // -----------------------------------
    // Determine PREPARE athlete.
    //
    // Previous athlete remains in PREPARE
    // only if another attempt exists in
    // the current phase.
    //
    // They do NOT automatically return to
    // the platform.
    //
    // They must declare their next attempt.
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
    // DEBUG EVERY ATHLETE
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
            attempt?.phase
        );

        console.log(
            "Current Attempt:",
            attempt?.attemptNo
        );

        console.log(
            "Declared Weight:",
            attempt?.declaredWeight
        );

        console.log(
            "Declared At:",
            attempt?.declaredAt
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
            // Every athlete completed Snatch.
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
    // is ACTUALLY DECLARED.
    //
    // This is the critical rule.
    // -----------------------------------

    const eligibleEntries =
        getEligibleEntries(
            pendingEntries
        );

    console.log(
        "===================================="
    );

    console.log(
        "ELIGIBLE DECLARED ATHLETES:",
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
                attempt.declaredWeight
            );
        }
    );

    // -----------------------------------
    // NOBODY HAS DECLARED
    //
    // IMPORTANT:
    //
    // Do NOT put another athlete on the
    // platform just because they have an
    // opening weight.
    //
    // Platform remains EMPTY.
    //
    // Previous athlete becomes PREPARE
    // if they have another attempt.
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
            "===================================="
        );

        console.log(
            "WAITING FOR DECLARATION"
        );

        console.log(
            "Previous Current:",
            previousCurrentEntryId
                ?.toString() ?? "NONE"
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
    // SELECT NEXT ATHLETE
    //
    // IMPORTANT:
    //
    // Previous athlete is NOT excluded.
    //
    // If they declared their next attempt,
    // they compete again according to the
    // normal weight/order rules.
    //
    // Example:
    //
    // Patel Attempt 2 = 25 kg
    // Sahil Attempt 1 = 30 kg
    //
    // Patel gets selected.
    //
    // Patel Attempt 2 = 35 kg
    // Sahil Attempt 1 = 30 kg
    //
    // Sahil gets selected.
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
    // Final safety check
    //
    // NEVER allow an undeclared attempt
    // onto the platform.
    // -----------------------------------

    if (
        nextAttempt.declaredWeight == null ||
        nextAttempt.declaredWeight <= 0
    ) {

        throw new Error(
            `Safety error: ${nextAthlete.name} was selected without a valid declared weight.`
        );
    }

    // -----------------------------------
    // Phase safety check
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
            ?.toString() ?? "NONE"
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