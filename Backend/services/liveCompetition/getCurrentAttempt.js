const getCurrentAttempt = (competitionEntry) => {

    const findPendingAttempt = (attempts, phase) => {

        for (let i = 0; i < attempts.length; i++) {

            const attempt = attempts[i];

            if (attempt.result === "PENDING") {

                const previousAttempt =
                    i > 0 ? attempts[i - 1] : null;

                return {
                    completed: false,
                    phase,
                    attemptNo: attempt.attemptNo,
                    declaredWeight: attempt.declaredWeight,
                    previousDeclaredWeight:
                        previousAttempt?.declaredWeight ?? null,
                    result: attempt.result,
                };

            }

        }

        return null;

    };

    const snatchAttempt = findPendingAttempt(
        competitionEntry.snatchAttempts,
        "SNATCH"
    );

    if (snatchAttempt) {
        return snatchAttempt;
    }

    const cleanJerkAttempt = findPendingAttempt(
        competitionEntry.cleanJerkAttempts,
        "CLEAN_JERK"
    );

    if (cleanJerkAttempt) {
        return cleanJerkAttempt;
    }

    return {
        completed: true,
        phase: null,
        attemptNo: null,
        declaredWeight: null,
        previousDeclaredWeight: null,
    };

};

export default getCurrentAttempt;