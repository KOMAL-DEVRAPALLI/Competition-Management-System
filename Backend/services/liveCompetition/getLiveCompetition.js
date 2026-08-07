import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";

const getLiveCompetition = async (
    competitionId,
    gender
) => {

    const session = await LiveCompetition.findOne({
        competitionId,
        gender,
    });

    if (!session) {
        throw new Error(
            "Live competition has not been started."
        );
    }

    const entries = await buildWorkingSheetData(
        competitionId,
        gender,
        true
    );
console.log(
    entries.map((athlete) => ({
        lot: athlete.lotNumber,
        weight: athlete.weightCategory,
        display: athlete.displayWeightCategory,
    }))
);
    if (!entries.length) {
        throw new Error(
            "No athletes found for this session."
        );
    }

    const mapAthlete = (athlete) => ({

        entryId: athlete.entryId,

        athleteId: athlete.athleteId,

        name: athlete.name,

        registrationNo: athlete.registrationNo,

        lotNumber: athlete.lotNumber,

        bodyWeight: athlete.bodyWeight,

        weightCategory: athlete.weightCategory,

        isYouth: athlete.isYouth,

        isJunior: athlete.isJunior,

        isSenior: athlete.isSenior,

        event: [
            athlete.isYouth && "Y",
            athlete.isJunior && "J",
            athlete.isSenior && "S",
        ]
            .filter(Boolean)
            .join("/"),

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

        competitionEntry:
            athlete.competitionEntry,

    });

    const currentAthlete = entries.find(
        (athlete) =>
            athlete.entryId.toString() ===
            session.currentEntryId.toString()
    );

   const competitionResults = entries
    .map(mapAthlete)
    .sort((a, b) => {

        const weightA = parseFloat(
            a.weightCategory.replace("+", "")
        );

        const weightB = parseFloat(
            b.weightCategory.replace("+", "")
        );

        if (weightA !== weightB) {
            return weightA - weightB;
        }

        const isPlusA =
            a.weightCategory.startsWith("+");

        const isPlusB =
            b.weightCategory.startsWith("+");

        if (isPlusA !== isPlusB) {
            return isPlusA ? 1 : -1;
        }

        return a.lotNumber - b.lotNumber;

    });
    const pendingDeclarations = entries
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
                attempt.declaredWeight == null
            );

        })
        .map(mapAthlete);

    return {
        session,

        currentAthlete: currentAthlete
            ? mapAthlete(currentAthlete)
            : null,

        nextAthlete:
            pendingDeclarations.length > 0
                ? pendingDeclarations[0]
                : null,

        pendingDeclarations,

        competitionResults,

        totalAthletes: entries.length,
    };

};

export default getLiveCompetition;