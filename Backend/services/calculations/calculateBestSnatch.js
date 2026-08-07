const calculateBestSnatch = (attempts = []) => {

    const successfulAttempts = attempts
        .filter(
            (attempt) =>
                attempt.result === "GOOD" &&
                attempt.declaredWeight != null
        )
        .map(
            (attempt) => attempt.declaredWeight
        );

    if (successfulAttempts.length === 0) {
        return 0;
    }

    return Math.max(...successfulAttempts);

};

export default calculateBestSnatch;