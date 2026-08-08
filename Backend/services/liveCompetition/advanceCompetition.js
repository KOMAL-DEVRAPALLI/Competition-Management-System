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
    // Find an entry by ID
    // -----------------------------------

    const findEntryById = (
        entryId
    ) => {

        if (!entryId) {
            return null;
        }

        return entries.find(
            (entry) =>
                entry.entryId.toString() ===
                entryId.toString()
        );
    };

    // -----------------------------------
    // Check whether current attempt has
    // an official declaration
    // -----------------------------------

    const hasDeclaration = (
        entry
    ) => {

        if (!entry) {
            return false;
        }

        const attempt =
            getCurrentAttempt(
                entry.competitionEntry
            );

        return (
            !attempt.completed &&
            attempt.phase ===
                session.currentPhase &&
            attempt.declaredWeight != null &&
            attempt.declaredWeight > 0
        );
    };

    // -----------------------------------
    // Find next DECLARED athlete
    //
    // Only athletes whose CURRENT attempt
    // has an actual official declaration
    // are considered here.
    // -----------------------------------

    const findNextDeclaredAthlete = () => {

        const declaredEntries =
            entries.filter(
                (entry) => {

                    const attempt =
                        getCurrentAttempt(
                            entry.competitionEntry
                        );

                    const isCurrent =
                        session.currentEntryId &&
                        entry.entryId
                            .toString() ===
                        session.currentEntryId
                            .toString();

                    return (
                        !isCurrent &&
                        !attempt.completed &&
                        attempt.phase ===
                            session.currentPhase &&
                        attempt.declaredWeight != null &&
                        attempt.declaredWeight > 0
                    );
                }
            );

        if (!declaredEntries.length) {
            return null;
        }

        return selectNextAthlete(
            declaredEntries
        );
    };

    // -----------------------------------
    // Find next ATHLETE when nobody has
    // declared yet.
    //
    // IMPORTANT:
    //
    // Only Attempt 1 athletes are included.
    //
    // Their opening weight is used only
    // to establish the first-athlete
    // ordering.
    //
    // It is NOT treated as an official
    // declaration.
    // -----------------------------------

    const findNextUndeclaredAttemptOneAthlete =
        () => {

            const attemptOneEntries =
                entries.filter(
                    (entry) => {

                        const attempt =
                            getCurrentAttempt(
                                entry.competitionEntry
                            );

                        const isCurrent =
                            session.currentEntryId &&
                            entry.entryId
                                .toString() ===
                            session.currentEntryId
                                .toString();

                        return (
                            !isCurrent &&
                            !attempt.completed &&
                            attempt.phase ===
                                session.currentPhase &&
                            attempt.attemptNo === 1 &&
                            attempt.declaredWeight ==
                                null
                        );
                    }
                );

            if (
                !attemptOneEntries.length
            ) {
                return null;
            }

            return selectNextAthlete(
                attemptOneEntries
            );
        };

    // -----------------------------------
    // Determine whether previous athlete
    // still has another attempt in the
    // CURRENT phase.
    // -----------------------------------

    const previousEntry =
        findEntryById(
            previousCurrentEntryId
        );

    const previousAttempt =
        previousEntry
            ? getCurrentAttempt(
                  previousEntry.competitionEntry
              )
            : null;

    const previousHasAnotherAttempt =
        Boolean(
            previousAttempt &&
            !previousAttempt.completed &&
            previousAttempt.phase ===
                session.currentPhase
        );

    // -----------------------------------
    // Current phase pending athletes
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
        "Previous Has Another Attempt:",
        previousHasAnotherAttempt
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
            "Phase:",
            attempt.phase
        );

        console.log(
            "Attempt:",
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

    // =================================================
    // STEP 1
    //
    // If the previous athlete still has another
    // attempt in the same phase, they become PREPARE.
    //
    // DO NOT automatically put them on platform.
    // =================================================

    if (
        previousHasAnotherAttempt
    ) {

        session.currentEntryId =
            null;

        session.prepareEntryId =
            previousCurrentEntryId;

        console.log(
            "===== ATHLETE HAS ANOTHER ATTEMPT ====="
        );

        console.log(
            "Current Platform:",
            "NONE"
        );

        console.log(
            "Prepare Entry:",
            previousCurrentEntryId
                ?.toString()
        );

        await session.save();

        return session;
    }

    // =================================================
    // STEP 2
    //
    // Previous athlete has completed the current phase.
    //
    // We now need to find another athlete.
    // =================================================

    session.currentEntryId =
        null;

    session.prepareEntryId =
        null;

    // -----------------------------------
    // SNATCH
    // -----------------------------------

    if (
        session.currentPhase ===
        "SNATCH"
    ) {

        // -----------------------------------
        // Are there still Snatch attempts
        // remaining among ANY athletes?
        // -----------------------------------

        pendingEntries =
            getPendingEntries(
                "SNATCH"
            );

        if (
            pendingEntries.length > 0
        ) {

            console.log(
                "SNATCH STILL HAS ATHLETES."
            );

            // -----------------------------------
            // First priority:
            //
            // An athlete who has already
            // officially declared.
            // -----------------------------------

            const nextDeclaredAthlete =
                findNextDeclaredAthlete();

            if (
                nextDeclaredAthlete
            ) {

                const nextAttempt =
                    getCurrentAttempt(
                        nextDeclaredAthlete
                            .competitionEntry
                    );

                console.log(
                    "===== NEXT DECLARED ATHLETE ====="
                );

                console.log(
                    "Entry:",
                    nextDeclaredAthlete
                        .entryId
                        .toString()
                );

                console.log(
                    "Name:",
                    nextDeclaredAthlete.name
                );

                console.log(
                    "Attempt:",
                    nextAttempt.attemptNo
                );

                console.log(
                    "Declared Weight:",
                    nextAttempt.declaredWeight
                );

                // -----------------------------------
                // Declared athlete is ready for
                // platform.
                // -----------------------------------

                session.currentEntryId =
                    nextDeclaredAthlete.entryId;

                session.prepareEntryId =
                    null;

                await session.save();

                console.log(
                    "===== NEXT ATHLETE MOVED TO PLATFORM ====="
                );

                console.log(
                    "Current Entry:",
                    session.currentEntryId
                        .toString()
                );

                return session;
            }

            // -----------------------------------
            // Nobody has declared.
            //
            // Find next Attempt 1 athlete using
            // opening Snatch ordering.
            //
            // They become PREPARE, NOT CURRENT.
            // -----------------------------------

            const nextUndeclaredAthlete =
                findNextUndeclaredAttemptOneAthlete();

            if (
                nextUndeclaredAthlete
            ) {

                console.log(
                    "===== NEXT ATHLETE WAITING FOR DECLARATION ====="
                );

                console.log(
                    "Entry:",
                    nextUndeclaredAthlete
                        .entryId
                        .toString()
                );

                console.log(
                    "Name:",
                    nextUndeclaredAthlete.name
                );

                console.log(
                    "Opening Snatch:",
                    nextUndeclaredAthlete
                        .openingSnatch
                );

                session.currentEntryId =
                    null;

                session.prepareEntryId =
                    nextUndeclaredAthlete.entryId;

                await session.save();

                console.log(
                    "Current Platform:",
                    "NONE"
                );

                console.log(
                    "Prepare Entry:",
                    session.prepareEntryId
                        .toString()
                );

                return session;
            }

            // -----------------------------------
            // This means the remaining athletes
            // are waiting for declarations on
            // attempts 2/3.
            //
            // Do not automatically select them.
            // -----------------------------------

            console.log(
                "SNATCH ATHLETES REMAIN,"
            );

            console.log(
                "BUT NO ATHLETE IS READY/AVAILABLE FOR AUTOMATIC SELECTION."
            );

            await session.save();

            return session;
        }

        // -----------------------------------
        // NO SNATCH ATTEMPTS REMAIN
        //
        // Move to Clean & Jerk.
        // -----------------------------------

        console.log(
            "===== ALL SNATCH ATTEMPTS COMPLETED ====="
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

        // -----------------------------------
        // Find a declared Clean & Jerk
        // athlete, if one exists.
        // -----------------------------------

        const nextDeclaredCleanJerk =
            findNextDeclaredAthlete();

        if (
            nextDeclaredCleanJerk
        ) {

            session.currentEntryId =
                nextDeclaredCleanJerk.entryId;

            session.prepareEntryId =
                null;

            await session.save();

            return session;
        }

        // -----------------------------------
        // Otherwise prepare the next
        // Clean & Jerk Attempt 1 athlete.
        // -----------------------------------

        const nextCleanJerkAttemptOne =
            findNextUndeclaredAttemptOneAthlete();

        if (
            nextCleanJerkAttemptOne
        ) {

            session.currentEntryId =
                null;

            session.prepareEntryId =
                nextCleanJerkAttemptOne.entryId;

            await session.save();

            return session;
        }

        // -----------------------------------
        // No Clean & Jerk athlete found.
        // -----------------------------------

        session.currentEntryId =
            null;

        session.prepareEntryId =
            null;

        await session.save();

        return session;
    }

    // =================================================
    // CLEAN & JERK
    // =================================================

    if (
        session.currentPhase ===
        "CLEAN_JERK"
    ) {

        pendingEntries =
            getPendingEntries(
                "CLEAN_JERK"
            );

        // -----------------------------------
        // More Clean & Jerk attempts remain.
        // -----------------------------------

        if (
            pendingEntries.length > 0
        ) {

            // -----------------------------------
            // Already declared athlete first.
            // -----------------------------------

            const nextDeclaredAthlete =
                findNextDeclaredAthlete();

            if (
                nextDeclaredAthlete
            ) {

                session.currentEntryId =
                    nextDeclaredAthlete.entryId;

                session.prepareEntryId =
                    null;

                await session.save();

                return session;
            }

            // -----------------------------------
            // Otherwise prepare Attempt 1
            // athlete.
            // -----------------------------------

            const nextAttemptOneAthlete =
                findNextUndeclaredAttemptOneAthlete();

            if (
                nextAttemptOneAthlete
            ) {

                session.currentEntryId =
                    null;

                session.prepareEntryId =
                    nextAttemptOneAthlete.entryId;

                await session.save();

                return session;
            }

            // -----------------------------------
            // Remaining athletes are waiting
            // for declaration.
            // -----------------------------------

            await session.save();

            return session;
        }

        // -----------------------------------
        // EVERYTHING COMPLETED
        // -----------------------------------

        console.log(
            "===== COMPETITION FINISHED ====="
        );

        session.currentEntryId =
            null;

        session.prepareEntryId =
            null;

        session.status =
            "FINISHED";

        await session.save();

        return session;
    }

    // -----------------------------------
    // Safety fallback
    // -----------------------------------

    await session.save();

    return session;
};

export default advanceCompetition;