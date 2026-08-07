const getCurrentAttempt = (competitionEntry) => {

    const findPendingAttempt = (attempts, phase) => {

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

                    result:
                        attempt.result,
                };

            }

        }

        return null;

    };

    const snatch = findPendingAttempt(
        competitionEntry.snatchAttempts,
        "SNATCH"
    );

    if (snatch) {
        return snatch;
    }

    const cleanJerk = findPendingAttempt(
        competitionEntry.cleanJerkAttempts,
        "CLEAN_JERK"
    );

    if (cleanJerk) {
        return cleanJerk;
    }

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