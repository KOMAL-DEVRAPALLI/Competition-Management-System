import getCurrentAttempt from "./getCurrentAttempt.js";

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

        const weightA =
            attemptA.declaredWeight ??
            (
                attemptA.phase === "SNATCH"
                    ? a.openingSnatch
                    : a.openingCleanJerk
            ) ??
            Number.MAX_SAFE_INTEGER;

        const weightB =
            attemptB.declaredWeight ??
            (
                attemptB.phase === "SNATCH"
                    ? b.openingSnatch
                    : b.openingCleanJerk
            ) ??
            Number.MAX_SAFE_INTEGER;
           console.log(
    `${a.name} (${weightA})  vs  ${b.name} (${weightB})`
);
        if (weightA !== weightB) {
            return weightA - weightB;
        }
if (attemptA.attemptNo !== attemptB.attemptNo) {
    return attemptA.attemptNo - attemptB.attemptNo;
}
        const declaredAtA =
    a.competitionEntry[
        attemptA.phase === "SNATCH"
            ? "snatchAttempts"
            : "cleanJerkAttempts"
    ].find(
        (attempt) =>
            attempt.attemptNo ===
            attemptA.attemptNo
    )?.declaredAt;

const declaredAtB =
    b.competitionEntry[
        attemptB.phase === "SNATCH"
            ? "snatchAttempts"
            : "cleanJerkAttempts"
    ].find(
        (attempt) =>
            attempt.attemptNo ===
            attemptB.attemptNo
    )?.declaredAt;

if (
    declaredAtA &&
    declaredAtB &&
    declaredAtA.getTime() !== declaredAtB.getTime()
) {
    return declaredAtA - declaredAtB;
}

const isCurrentA =
    a.entryId.toString() ===
    currentEntryId?.toString();

const isCurrentB =
    b.entryId.toString() ===
    currentEntryId?.toString();

if (isCurrentA !== isCurrentB) {
    return isCurrentA ? 1 : -1;
}

        const lotA =
            a.lotNumber ??
            Number.MAX_SAFE_INTEGER;

        const lotB =
            b.lotNumber ??
            Number.MAX_SAFE_INTEGER;

        return lotA - lotB;

    });

    console.log(
    "Sorted order:",
    sortedEntries.map((athlete) => ({
        name: athlete.name,
        weight:
            getCurrentAttempt(athlete.competitionEntry)
                .declaredWeight ??
            athlete.openingSnatch,
    }))
);

return sortedEntries[0];

};

export default selectNextAthlete;