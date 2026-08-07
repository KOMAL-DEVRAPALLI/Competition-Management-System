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

const selectNextAthlete = (
    entries,
    currentEntryId
) => {

    if (!entries.length) {
        return null;
    }

    const sortedEntries = [...entries].sort((a, b) => {

        const attemptA = getCurrentAttempt(
            a.competitionEntry
        );

        const attemptB = getCurrentAttempt(
            b.competitionEntry
        );

        const weightA = getAttemptWeight(
            a,
            attemptA
        );

        const weightB = getAttemptWeight(
            b,
            attemptB
        );

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

        // 4. Current athlete lifts last if still tied
        const isCurrentA =
            a.entryId.toString() ===
            currentEntryId?.toString();

        const isCurrentB =
            b.entryId.toString() ===
            currentEntryId?.toString();

        if (isCurrentA !== isCurrentB) {
            return isCurrentA ? 1 : -1;
        }

        // 5. Lowest lot number
        const lotA =
            a.lotNumber ??
            Number.MAX_SAFE_INTEGER;

        const lotB =
            b.lotNumber ??
            Number.MAX_SAFE_INTEGER;

        return lotA - lotB;

    });

    return sortedEntries[0];

};

export default selectNextAthlete;