import getCurrentAttempt from "./getCurrentAttempt.js";

// -----------------------------------
// Get current attempt weight
// -----------------------------------

const getAttemptWeight = (
    entry,
    attempt
) => {

    if (!attempt) {
        return Number.MAX_SAFE_INTEGER;
    }

    // -----------------------------------
    // Declared weight
    // -----------------------------------

    if (
        attempt.declaredWeight != null &&
        attempt.declaredWeight > 0
    ) {
        return Number(
            attempt.declaredWeight
        );
    }

    // -----------------------------------
    // Attempt 1 can use opening weight
    // -----------------------------------

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
// Get previous attempt
//
// Example:
//
// Current Attempt 1
// → no previous attempt
//
// Current Attempt 2
// → Attempt 1
//
// Current Attempt 3
// → Attempt 2
// -----------------------------------

const getPreviousAttempt = (
    competitionEntry,
    currentAttempt
) => {

    if (
        !currentAttempt ||
        currentAttempt.attemptNo <= 1
    ) {
        return null;
    }

    const attempts =
        currentAttempt.phase === "SNATCH"
            ? competitionEntry.snatchAttempts
            : competitionEntry.cleanJerkAttempts;

    return (
        attempts.find(
            (attempt) =>
                attempt.attemptNo ===
                currentAttempt.attemptNo - 1
        ) ?? null
    );
};


// -----------------------------------
// Get previous attempt completion time
//
// This is used only when:
// - weight is equal
// - attempt number is equal
//
// The athlete whose previous attempt
// was completed earlier has priority.
// -----------------------------------

const getPreviousAttemptSequence = (
    competitionEntry,
    currentAttempt
) => {

    const previousAttempt =
        getPreviousAttempt(
            competitionEntry,
            currentAttempt
        );

    // -----------------------------------
    // No previous attempt
    //
    // This applies to Attempt 1.
    // -----------------------------------

    if (!previousAttempt) {
        return Number.MAX_SAFE_INTEGER;
    }

    // -----------------------------------
    // Previous attempt must have been
    // completed.
    // -----------------------------------

    if (!previousAttempt.completedAt) {
        return Number.MAX_SAFE_INTEGER;
    }

    const completedTime =
        new Date(
            previousAttempt.completedAt
        ).getTime();

    return Number.isNaN(completedTime)
        ? Number.MAX_SAFE_INTEGER
        : completedTime;
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

                // -----------------------------------
                // 1. LOWEST WEIGHT
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
                // 2. LOWEST ATTEMPT NUMBER
                // -----------------------------------

                const attemptNoA =
                    attemptA?.attemptNo ??
                    Number.MAX_SAFE_INTEGER;

                const attemptNoB =
                    attemptB?.attemptNo ??
                    Number.MAX_SAFE_INTEGER;

                if (
                    attemptNoA !==
                    attemptNoB
                ) {

                    return (
                        attemptNoA -
                        attemptNoB
                    );
                }


                // -----------------------------------
                // 3. PREVIOUS ATTEMPT SEQUENCE
                //
                // Earlier previous attempt
                // completion = earlier lifting
                // sequence.
                // -----------------------------------

                const sequenceA =
                    getPreviousAttemptSequence(
                        a.competitionEntry,
                        attemptA
                    );

                const sequenceB =
                    getPreviousAttemptSequence(
                        b.competitionEntry,
                        attemptB
                    );

                if (
                    sequenceA !==
                    sequenceB
                ) {

                    return (
                        sequenceA -
                        sequenceB
                    );
                }


                // -----------------------------------
                // 4. LOWEST LOT NUMBER
                // -----------------------------------

                const lotA =
                    a.lotNumber ??
                    Number.MAX_SAFE_INTEGER;

                const lotB =
                    b.lotNumber ??
                    Number.MAX_SAFE_INTEGER;

                if (
                    lotA !== lotB
                ) {

                    return (
                        lotA -
                        lotB
                    );
                }


                // -----------------------------------
                // 5. STABLE FALLBACK
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
    // FINAL DEBUG
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

    const selectedPreviousAttempt =
        getPreviousAttempt(
            selected.competitionEntry,
            selectedAttempt
        );

    console.log({
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

        previousAttempt:
            selectedPreviousAttempt
                ?.attemptNo ?? null,

        previousAttemptResult:
            selectedPreviousAttempt
                ?.result ?? null,

        previousAttemptCompletedAt:
            selectedPreviousAttempt
                ?.completedAt ?? null,

        lot:
            selected.lotNumber,
    });


    return selected;
};

export default selectNextAthlete;