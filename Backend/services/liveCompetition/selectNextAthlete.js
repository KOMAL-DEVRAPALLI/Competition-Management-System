import getCurrentAttempt from "./getCurrentAttempt.js";

// -----------------------------------
// Get attempt weight
// -----------------------------------

const getAttemptWeight = (
    entry,
    attempt
) => {

    if (!attempt) {
        return Number.MAX_SAFE_INTEGER;
    }

    if (
        attempt.declaredWeight != null &&
        attempt.declaredWeight > 0
    ) {
        return Number(
            attempt.declaredWeight
        );
    }

    const openingWeight =
        attempt.phase === "SNATCH"
            ? entry.openingSnatch
            : entry.openingCleanJerk;

    return (
        openingWeight != null &&
        openingWeight > 0
            ? Number(openingWeight)
            : Number.MAX_SAFE_INTEGER
    );
};


// -----------------------------------
// Get declaration time
// -----------------------------------

const getDeclarationTime = (
    attempt
) => {

    if (
        !attempt ||
        !attempt.declaredAt
    ) {
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


// -----------------------------------
// Select next athlete
// -----------------------------------

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

                const declarationA =
                    getDeclarationTime(
                        attemptA
                    );

                const declarationB =
                    getDeclarationTime(
                        attemptB
                    );

                const lotA =
                    a.lotNumber ??
                    Number.MAX_SAFE_INTEGER;

                const lotB =
                    b.lotNumber ??
                    Number.MAX_SAFE_INTEGER;


                // -----------------------------------
                // DEBUG
                // -----------------------------------

                console.log(
                    "===== ATHLETE ORDER DATA ====="
                );

                console.log(
                    "ATHLETE A:",
                    {
                        name:
                            a.name,

                        entryId:
                            a.entryId?.toString(),

                        phase:
                            attemptA?.phase,

                        attempt:
                            attemptA?.attemptNo,

                        weight:
                            weightA,

                        declaredWeight:
                            attemptA?.declaredWeight,

                        declaredAt:
                            attemptA?.declaredAt,

                        declarationTime:
                            declarationA,

                        lot:
                            lotA,
                    }
                );

                console.log(
                    "ATHLETE B:",
                    {
                        name:
                            b.name,

                        entryId:
                            b.entryId?.toString(),

                        phase:
                            attemptB?.phase,

                        attempt:
                            attemptB?.attemptNo,

                        weight:
                            weightB,

                        declaredWeight:
                            attemptB?.declaredWeight,

                        declaredAt:
                            attemptB?.declaredAt,

                        declarationTime:
                            declarationB,

                        lot:
                            lotB,
                    }
                );


                // -----------------------------------
                // 1. LOWEST WEIGHT
                // -----------------------------------

                if (
                    weightA !== weightB
                ) {

                    return (
                        weightA -
                        weightB
                    );

                }


                // -----------------------------------
                // 2. EARLIEST DECLARATION
                // -----------------------------------

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
                // 3. LOWEST LOT NUMBER
                // -----------------------------------

                if (
                    lotA !== lotB
                ) {

                    return (
                        lotA -
                        lotB
                    );

                }


                // -----------------------------------
                // 4. STABLE FALLBACK
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


    // -----------------------------------
    // FINAL SELECTION DEBUG
    // -----------------------------------

    console.log(
        "===== SELECTED NEXT ATHLETE ====="
    );

    const selected =
        sortedEntries[0];

    const selectedAttempt =
        getCurrentAttempt(
            selected.competitionEntry
        );

    console.log(
        {
            name:
                selected.name,

            entryId:
                selected.entryId?.toString(),

            phase:
                selectedAttempt?.phase,

            attempt:
                selectedAttempt?.attemptNo,

            weight:
                getAttemptWeight(
                    selected,
                    selectedAttempt
                ),

            declaredWeight:
                selectedAttempt
                    ?.declaredWeight,

            declaredAt:
                selectedAttempt
                    ?.declaredAt,

            lot:
                selected.lotNumber,
        }
    );


    return selected;
};

export default selectNextAthlete;