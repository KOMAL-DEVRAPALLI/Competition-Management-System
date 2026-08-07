import getCurrentAttempt from "./getCurrentAttempt.js";

const selectNextAthlete = (entries, currentEntryId) => {
    if (!entries.length) {
        return null;
    }

    const sortedEntries = [...entries].sort((a, b) => {
        const attemptA = getCurrentAttempt(a.competitionEntry);
        const attemptB = getCurrentAttempt(b.competitionEntry);

        const weightA =
            attemptA.declaredWeight ??
            (attemptA.phase === "SNATCH"
                ? a.openingSnatch
                : a.openingCleanJerk) ??
            Number.MAX_SAFE_INTEGER;

        const weightB =
            attemptB.declaredWeight ??
            (attemptB.phase === "SNATCH"
                ? b.openingSnatch
                : b.openingCleanJerk) ??
            Number.MAX_SAFE_INTEGER;

        console.log(
            `${a.name} (${weightA}) vs ${b.name} (${weightB})`
        );

        // 1. Lowest declared weight first
        if (weightA !== weightB) {
            return weightA - weightB;
        }

        // 2. Lowest attempt number first
        if (attemptA.attemptNo !== attemptB.attemptNo) {
            return attemptA.attemptNo - attemptB.attemptNo;
        }

        // 3. Earliest declaration time
        const declaredAtA = a.competitionEntry[
            attemptA.phase === "SNATCH"
                ? "snatchAttempts"
                : "cleanJerkAttempts"
        ].find(
            (attempt) => attempt.attemptNo === attemptA.attemptNo
        )?.declaredAt;

        const declaredAtB = b.competitionEntry[
            attemptB.phase === "SNATCH"
                ? "snatchAttempts"
                : "cleanJerkAttempts"
        ].find(
            (attempt) => attempt.attemptNo === attemptB.attemptNo
        )?.declaredAt;

        if (
            declaredAtA &&
            declaredAtB &&
            declaredAtA.getTime() !== declaredAtB.getTime()
        ) {
            return declaredAtA.getTime() - declaredAtB.getTime();
        }

        // 4. Current athlete goes after others if still tied
        const isCurrentA =
            a.entryId.toString() === currentEntryId?.toString();

        const isCurrentB =
            b.entryId.toString() === currentEntryId?.toString();

        if (isCurrentA !== isCurrentB) {
            return isCurrentA ? 1 : -1;
        }

        // 5. Lot number
        const lotA = a.lotNumber ?? Number.MAX_SAFE_INTEGER;
        const lotB = b.lotNumber ?? Number.MAX_SAFE_INTEGER;

        return lotA - lotB;
    });

    console.log(
        "Sorted order:",
        sortedEntries.map((athlete) => {
            const attempt = getCurrentAttempt(
                athlete.competitionEntry
            );

            return {
                name: athlete.name,
                attemptNo: attempt.attemptNo,
                weight:
                    attempt.declaredWeight ??
                    (attempt.phase === "SNATCH"
                        ? athlete.openingSnatch
                        : athlete.openingCleanJerk),
            };
        })
    );
console.log(
  sortedEntries.map((entry) => {
    const attempt = getCurrentAttempt(entry.competitionEntry);

    return {
      name: entry.name,
      weight: attempt.declaredWeight,
      attempt: attempt.attemptNo,
      result: attempt.result,
    };
  })
);

console.log("Selected:", sortedEntries[0].name);
    return sortedEntries[0];
};

export default selectNextAthlete;