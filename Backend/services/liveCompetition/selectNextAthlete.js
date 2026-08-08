import getCurrentAttempt from "./getCurrentAttempt.js";

const getAttemptWeight = (
    entry,
    attempt
) => {

    if (
        attempt.declaredWeight != null
    ) {
        return attempt.declaredWeight;
    }

    const openingWeight =
        attempt.phase === "SNATCH"
            ? entry.openingSnatch
            : entry.openingCleanJerk;

    return (
        openingWeight ??
        Number.MAX_SAFE_INTEGER
    );
};

const getDeclarationTime = (
    attempt
) => {

    if (!attempt.declaredAt) {
        return Number.MAX_SAFE_INTEGER;
    }

    const time =
        new Date(
            attempt.declaredAt
        ).getTime();

    return Number.isNaN(time)
        ? Number.MAX_SAFE_INTEGER
        : time;
};

const selectNextAthlete = (
    entries
) => {

    if (!entries.length) {
        return null;
    }

    const sortedEntries =
        [...entries].sort(
            (a, b) => {

                const attemptA =
                    getCurrentAttempt(
                        a.competitionEntry
                    );

                const attemptB =
                    getCurrentAttempt(
                        b.competitionEntry
                    );

                // -----------------------------------
                // 1. Lowest declared weight
                // -----------------------------------

                const weightA =
                    getAttemptWeight(
                        a,
                        attemptA
                    );

                const weightB =
                    getAttemptWeight(
                        b,
                        attemptB
                    );

                if (
                    weightA !== weightB
                ) {
                    return (
                        weightA -
                        weightB
                    );
                }

                // -----------------------------------
                // 2. Earliest declaration
                // -----------------------------------

                const declarationA =
                    getDeclarationTime(
                        attemptA
                    );

                const declarationB =
                    getDeclarationTime(
                        attemptB
                    );

                if (
                    declarationA !==
                    declarationB
                ) {
                    return (
                        declarationA -
                        declarationB
                    );
                }

                // -----------------------------------
                // 3. Lowest lot number
                // -----------------------------------

                const lotA =
                    a.lotNumber ??
                    Number.MAX_SAFE_INTEGER;

                const lotB =
                    b.lotNumber ??
                    Number.MAX_SAFE_INTEGER;

                if (lotA !== lotB) {
                    return lotA - lotB;
                }

                // -----------------------------------
                // 4. Stable fallback
                // -----------------------------------

                return (
                    a.entryId
                        .toString()
                        .localeCompare(
                            b.entryId
                                .toString()
                        )
                );

            }
        );

    return sortedEntries[0];
};

export default selectNextAthlete;