import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";

const getLiveCompetition = async (
    competitionId,
    gender
) => {

    // -----------------------------------
    // Normalize gender
    // -----------------------------------

    const normalizedGender =
        gender.toLowerCase();

    // -----------------------------------
    // Find live competition session
    // -----------------------------------

    const session =
        await LiveCompetition.findOne({
            competitionId,
            gender: normalizedGender,
        });

    if (!session) {
        throw new Error(
            "Live competition has not been started."
        );
    }

    // -----------------------------------
    // Load all athletes
    // -----------------------------------

    const entries =
        await buildWorkingSheetData(
            competitionId,
            normalizedGender,
            true,
            session.selectedWeightCategories
        );

    if (!entries.length) {
        throw new Error(
            "No athletes found."
        );
    }

    // -----------------------------------
    // Athlete mapper
    // -----------------------------------

    const mapAthlete = (
        athlete,
        status = "WAITING"
    ) => {

        const currentAttempt =
            getCurrentAttempt(
                athlete.competitionEntry
            );

        return {

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

            displayWeightCategory:
                athlete.displayWeightCategory,

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

            currentAttempt,

            snatchAttempts:
                athlete.competitionEntry
                    .snatchAttempts,

            cleanJerkAttempts:
                athlete.competitionEntry
                    .cleanJerkAttempts,

            status,

        };
    };

    // -----------------------------------
    // CURRENT ATHLETE
    //
    // ONLY the athlete manually selected
    // by the official.
    // -----------------------------------

    const currentEntry =
        session.currentEntryId
            ? entries.find(
                  (entry) =>
                      entry.entryId
                          .toString() ===
                      session.currentEntryId
                          .toString()
              )
            : null;

    // -----------------------------------
    // Competition results / TV scoreboard
    // -----------------------------------

    const competitionResults =
        entries.map(
            (entry) => {

                const attempt =
                    getCurrentAttempt(
                        entry.competitionEntry
                    );

                let status =
                    "WAITING";

                // Current manually selected athlete
                if (
                    session.currentEntryId &&
                    entry.entryId
                        .toString() ===
                    session.currentEntryId
                        .toString()
                ) {

                    status =
                        "ON_PLATFORM";

                }

                // Athlete has completed
                else if (
                    attempt.completed
                ) {

                    status =
                        "COMPLETED";

                }

                return mapAthlete(
                    entry,
                    status
                );

            }
        );

    // -----------------------------------
    // OFFICIAL ATHLETE LIST
    //
    // This is NOT an automatic queue.
    //
    // Official can manually select ANY
    // unfinished athlete whose next
    // attempt belongs to the current
    // phase.
    // -----------------------------------

    const declarationQueue =
        entries
            .filter(
                (entry) => {

                    // -----------------------------------
                    // Do not show current athlete
                    // again in selection list.
                    // -----------------------------------

                    if (
                        session.currentEntryId &&
                        entry.entryId
                            .toString() ===
                        session.currentEntryId
                            .toString()
                    ) {

                        return false;

                    }

                    const attempt =
                        getCurrentAttempt(
                            entry.competitionEntry
                        );

                    // -----------------------------------
                    // Athlete must:
                    //
                    // 1. Not be completed
                    // 2. Have next attempt in
                    //    current phase
                    // -----------------------------------

                    return (
                        !attempt.completed &&
                        attempt.phase ===
                            session.currentPhase
                    );

                }
            )
            .map(
                (entry) =>
                    mapAthlete(
                        entry,
                        "DECLARATION"
                    )
            );

    // -----------------------------------
    // Debug
    // -----------------------------------

    console.log(
        "===================================="
    );

    console.log(
        "GET LIVE COMPETITION"
    );

    console.log(
        "Current Phase:",
        session.currentPhase
    );

    console.log(
        "Current Entry:",
        session.currentEntryId
            ?.toString() ?? "NONE"
    );

    console.log(
        "Current Athlete:",
        currentEntry?.name ?? "NONE"
    );

    console.log(
        "Official Athlete List:",
        declarationQueue.length
    );

    // -----------------------------------
    // Final response
    // -----------------------------------

    return {

        status:
            session.status,

        sessionName:
            session.sessionName,

        selectedWeightCategories:
            session.selectedWeightCategories,

        currentPhase:
            session.currentPhase,

        // -----------------------------------
        // Manually selected athlete only
        // -----------------------------------

        currentAthlete:
            currentEntry
                ? mapAthlete(
                      currentEntry,
                      "ON_PLATFORM"
                  )
                : null,

        // -----------------------------------
        // Complete official selection list
        // -----------------------------------

        declarationQueue,

        // -----------------------------------
        // TV scoreboard
        // -----------------------------------

        competitionResults,

        totalAthletes:
            competitionResults.length,

    };
};

export default getLiveCompetition;