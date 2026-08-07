import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";
import selectNextAthlete from "./selectNextAthlete.js";

const startLiveCompetition = async ({
    competitionId,
    gender,
    sessionName = "",
    selectedWeightCategories = [],
}) => {

    let entries = await buildWorkingSheetData(
        competitionId,
        gender,
        true
    );

    // Filter by selected weight categories.
    // Empty array means include all categories.
    if (selectedWeightCategories.length > 0) {

        entries = entries.filter((athlete) =>
            selectedWeightCategories.includes(
                athlete.weightCategory
            )
        );

    }

    if (!entries.length) {
        throw new Error(
            "No athletes found for this session."
        );
    }

    await LiveCompetition.deleteMany({
        competitionId,
        gender,
    });

    const eligibleEntries = entries.filter(
        (athlete) => {

            const attempt =
                getCurrentAttempt(
                    athlete.competitionEntry
                );

            return (
                !attempt.completed &&
                attempt.phase === "SNATCH"
            );

        }
    );

    const firstAthlete =
        selectNextAthlete(
            eligibleEntries
        );

    if (!firstAthlete) {
        throw new Error(
            "Unable to determine first athlete."
        );
    }

    const session =
        await LiveCompetition.create({

            competitionId,

            gender,

            sessionName,

            selectedWeightCategories,

            currentEntryId:
                firstAthlete.entryId,

            prepareEntryId: null,

            currentPhase:
                "SNATCH",

            status: "READY",

        });

    const mapAthlete = (athlete) => ({

        entryId:
            athlete.entryId,

        athleteId:
            athlete.athleteId,

        name:
            athlete.name,

        registrationNo:
            athlete.registrationNo,

        lotNumber:
            athlete.lotNumber,

        bodyWeight:
            athlete.bodyWeight,

        weightCategory:
            athlete.weightCategory,

        openingSnatch:
            athlete.openingSnatch,

        openingCleanJerk:
            athlete.openingCleanJerk,

        bestSnatch:
            athlete.bestSnatch,

        bestCleanJerk:
            athlete.bestCleanJerk,

        total:
            athlete.total,

        place:
            athlete.place,

        currentAttempt:
            getCurrentAttempt(
                athlete.competitionEntry
            ),

        snatchAttempts:
            athlete.competitionEntry
                .snatchAttempts,

        cleanJerkAttempts:
            athlete.competitionEntry
                .cleanJerkAttempts,

        competitionEntry:
            athlete.competitionEntry,

    });

    const currentAthlete =
        entries.find(
            (athlete) =>
                athlete.entryId.toString() ===
                session.currentEntryId.toString()
        );

    const queue = entries
        .filter((athlete) => {

            if (
                athlete.entryId.toString() ===
                session.currentEntryId.toString()
            ) {
                return false;
            }

            const attempt =
                getCurrentAttempt(
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

        currentAthlete:
            currentAthlete
                ? mapAthlete(
                      currentAthlete
                  )
                : null,

        queue,

        totalAthletes:
            entries.length,

    };

};

export default startLiveCompetition;