const getCurrentAttempt = (competitionEntry) => {

    // -----------------------------------
    // Find the first incomplete attempt
    // -----------------------------------
    const findFirstIncompleteAttempt = (
        attempts,
        phase
    ) => {

        for (const attempt of attempts) {

            if (attempt.result === "PENDING") {

                return {
                    completed: false,
                    phase,
                    attemptNo: attempt.attemptNo,
                    declaredWeight:
                        attempt.declaredWeight,
                    declaredAt:
                        attempt.declaredAt,
                    result: attempt.result,
                };

            }

        }

        return null;
    };

    // -----------------------------------
    // SNATCH
    //
    // Snatch always has priority.
    // The athlete cannot move to
    // Clean & Jerk while any Snatch
    // attempt is still incomplete.
    // -----------------------------------

    let attempt =
        findFirstIncompleteAttempt(
            competitionEntry.snatchAttempts,
            "SNATCH"
        );

    if (attempt) {
        return attempt;
    }

    // -----------------------------------
    // CLEAN & JERK
    //
    // Reached only after all Snatch
    // attempts are completed.
    // -----------------------------------

    attempt =
        findFirstIncompleteAttempt(
            competitionEntry.cleanJerkAttempts,
            "CLEAN_JERK"
        );

    if (attempt) {
        return attempt;
    }

    // -----------------------------------
    // COMPETITION COMPLETED
    // -----------------------------------

    return {
        completed: true,
        phase: null,
        attemptNo: null,
        declaredWeight: null,
        declaredAt: null,
        result: null,
    };
};

export default getCurrentAttempt;