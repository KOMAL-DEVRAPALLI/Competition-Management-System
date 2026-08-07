const getCurrentAttempt = (competitionEntry) => {

    const findReadyAttempt = (attempts, phase) => {

        for (const attempt of attempts) {

            if (
                attempt.result === "PENDING" &&
                attempt.declaredWeight != null
            ) {

                return {
                    completed: false,
                    phase,
                    attemptNo: attempt.attemptNo,
                    declaredWeight: attempt.declaredWeight,
                    declaredAt: attempt.declaredAt,
                    result: attempt.result,
                };

            }

        }

        return null;

    };

    const findPendingAttempt = (attempts, phase) => {

        for (const attempt of attempts) {

            if (attempt.result === "PENDING") {

                return {
                    completed: false,
                    phase,
                    attemptNo: attempt.attemptNo,
                    declaredWeight: attempt.declaredWeight,
                    declaredAt: attempt.declaredAt,
                    result: attempt.result,
                };

            }

        }

        return null;

    };

    let attempt = findReadyAttempt(
        competitionEntry.snatchAttempts,
        "SNATCH"
    );

    if (attempt) return attempt;

    attempt = findReadyAttempt(
        competitionEntry.cleanJerkAttempts,
        "CLEAN_JERK"
    );

    if (attempt) return attempt;

    attempt = findPendingAttempt(
        competitionEntry.snatchAttempts,
        "SNATCH"
    );

    if (attempt) return attempt;

    attempt = findPendingAttempt(
        competitionEntry.cleanJerkAttempts,
        "CLEAN_JERK"
    );

    if (attempt) return attempt;

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