import getCurrentAttempt from "./getCurrentAttempt.js";

const getAttemptWeight = (entry, attempt) => {

    return (
        attempt.declaredWeight ??
        (
            attempt.phase === "SNATCH"
                ? entry.openingSnatch
                : entry.openingCleanJerk
        ) ??
        Number.MAX_SAFE_INTEGER
    );

};

const selectNextAthlete = (entries) => {

    if (!entries.length) {
        return null;
    }

    const sortedEntries = [...entries].sort((a, b) => {

        const attemptA =
            getCurrentAttempt(a.competitionEntry);

        const attemptB =
            getCurrentAttempt(b.competitionEntry);

        const weightA =
            getAttemptWeight(a, attemptA);

        const weightB =
            getAttemptWeight(b, attemptB);

        // 1. Lowest declared weight
        if (weightA !== weightB) {
            return weightA - weightB;
        }

        // 2. Lowest attempt number
        if (attemptA.attemptNo !== attemptB.attemptNo) {
            return (
                attemptA.attemptNo -
                attemptB.attemptNo
            );
        }

        // 3. Earliest declaration
        if (
            attemptA.declaredAt &&
            attemptB.declaredAt &&
            attemptA.declaredAt.getTime() !==
                attemptB.declaredAt.getTime()
        ) {
            return (
                attemptA.declaredAt.getTime() -
                attemptB.declaredAt.getTime()
            );
        }

        // 4. Lowest lot number
        return (
            (a.lotNumber ?? Number.MAX_SAFE_INTEGER) -
            (b.lotNumber ?? Number.MAX_SAFE_INTEGER)
        );

    });

    return sortedEntries[0];

};

export default selectNextAthlete;