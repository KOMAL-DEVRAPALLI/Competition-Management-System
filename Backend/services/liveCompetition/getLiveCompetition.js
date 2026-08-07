import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";
import selectNextAthlete from "./selectNextAthlete.js";

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

    if (!entries.length) {
        throw new Error(
            "No athletes found."
        );
    }

    const currentEntry = entries.find(
        (entry) =>
            entry.entryId.toString() ===
            session.currentEntryId?.toString()
    );

    const eligibleEntries = entries.filter((entry) => {

        const attempt = getCurrentAttempt(
            entry.competitionEntry
        );

        return (
            !attempt.completed &&
            attempt.phase === session.currentPhase &&
            entry.entryId.toString() !==
                session.currentEntryId?.toString()
        );

    });

    const nextEntry = selectNextAthlete(
        eligibleEntries,
        session.currentEntryId
    );

    const mapAthlete = (
        athlete,
        status = "WAITING"
    ) => {

        const attempt = getCurrentAttempt(
            athlete.competitionEntry
        );

        return {

            entryId: athlete.entryId,

            athleteId: athlete.athleteId,

            name: athlete.name,

            registrationNo:
                athlete.registrationNo,

            lotNumber: athlete.lotNumber,

            bodyWeight: athlete.bodyWeight,

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

            total: athlete.total,

            place: athlete.place,

            currentAttempt: attempt,

            snatchAttempts:
                athlete.competitionEntry
                    .snatchAttempts,

            cleanJerkAttempts:
                athlete.competitionEntry
                    .cleanJerkAttempts,

            status,

        };

    };

    const competitionResults = entries.map(
        (entry) => {

            const attempt =
                getCurrentAttempt(
                    entry.competitionEntry
                );

            let status = "WAITING";

            if (attempt.completed) {

                status = "COMPLETED";

            } else if (
                entry.entryId.toString() ===
                session.currentEntryId?.toString()
            ) {

                status = "ON_PLATFORM";

            } else if (
                nextEntry &&
                entry.entryId.toString() ===
                nextEntry.entryId.toString()
            ) {

                status = "NEXT";

            }

            return mapAthlete(
                entry,
                status
            );

        }
    );

    const declarationQueue = entries
        .filter((entry) => {

            const attempt =
                getCurrentAttempt(
                    entry.competitionEntry
                );

            return (
                !attempt.completed &&
                entry.entryId.toString() !==
                    session.currentEntryId?.toString()
            );

        })
        .map((entry) =>
            mapAthlete(entry)
        );

    return {

        status: session.status,

        currentPhase:
            session.currentPhase,

        currentAthlete:
            currentEntry
                ? mapAthlete(
                      currentEntry,
                      "ON_PLATFORM"
                  )
                : null,

        nextAthlete:
            nextEntry
                ? mapAthlete(
                      nextEntry,
                      "NEXT"
                  )
                : null,

        declarationQueue,

        competitionResults,

        totalAthletes:
            competitionResults.length,

    };

};

export default getLiveCompetition;