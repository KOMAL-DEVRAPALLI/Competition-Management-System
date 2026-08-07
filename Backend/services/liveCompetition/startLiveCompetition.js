import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";
import selectNextAthlete from "./selectNextAthlete.js";
const startLiveCompetition = async (
    competitionId,
    gender
) => {

    const entries = await buildWorkingSheetData(
    competitionId,
    gender,
    true
);

if (!entries.length) {
    throw new Error("No athletes found for this session.");
}

await LiveCompetition.deleteMany({
    competitionId,
    gender,
});

let session = null;

if (!session) {

    const eligibleEntries = entries.filter((athlete) => {

        const attempt = getCurrentAttempt(
            athlete.competitionEntry
        );

        return (
            !attempt.completed &&
            attempt.phase === "SNATCH"
        );

    });

    const firstAthlete =
        selectNextAthlete(eligibleEntries);

    if (!firstAthlete) {
        throw new Error(
            "Unable to determine first athlete."
        );
    }

    session = await LiveCompetition.create({
        competitionId,
        gender,
        currentEntryId: firstAthlete.entryId,
        currentPhase: "SNATCH",
        status: "READY",
    });

}
console.log(
    "Created:",
    session.currentEntryId.toString()
);
   const mapAthlete = (athlete) => ({

    entryId: athlete.entryId,

    athleteId: athlete.athleteId,

    name: athlete.name,

    registrationNo: athlete.registrationNo,

    lotNumber: athlete.lotNumber,

    bodyWeight: athlete.bodyWeight,

    weightCategory: athlete.weightCategory,

    openingSnatch: athlete.openingSnatch,

    openingCleanJerk: athlete.openingCleanJerk,

    bestSnatch: athlete.bestSnatch,

    bestCleanJerk: athlete.bestCleanJerk,

    total: athlete.total,

    place: athlete.place,

    currentAttempt: getCurrentAttempt(
        athlete.competitionEntry
    ),

    snatchAttempts:
        athlete.competitionEntry.snatchAttempts,

    cleanJerkAttempts:
        athlete.competitionEntry.cleanJerkAttempts,

    competitionEntry: athlete.competitionEntry,

});

   const foundAthlete = entries.find(
    (athlete) =>
        athlete.entryId.toString() ===
        session.currentEntryId.toString()
);

console.log(
    "Session currentEntryId:",
    session.currentEntryId.toString()
);

console.log(
    "Available entries:",
    entries.map((entry) => ({
        name: entry.name,
        entryId: entry.entryId.toString(),
    }))
);

console.log(
    "Found athlete:",
    foundAthlete?.name
);

const currentAthlete = foundAthlete
    ? mapAthlete(foundAthlete)
    : null;

   const queue = entries
    .filter((athlete) => {

        if (
            athlete.entryId.toString() ===
            session.currentEntryId.toString()
        ) {
            return false;
        }

        const attempt = getCurrentAttempt(
            athlete.competitionEntry
        );

        return (
            !attempt.completed &&
            attempt.declaredWeight != null
        );

    })
    .map(mapAthlete);

    return {
        session,
        currentAthlete,
        queue,
        totalAthletes: entries.length,
    };

};

export default startLiveCompetition;