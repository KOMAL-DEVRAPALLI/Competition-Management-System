import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";

const getLiveCompetition = async (
    competitionId,
    gender
) => {

    // =====================================
    // NORMALIZE GENDER
    // =====================================

    if (!competitionId) {
        throw new Error(
            "Competition ID is required."
        );
    }

    if (!gender) {
        throw new Error(
            "Gender is required."
        );
    }

    const normalizedGender =
        gender.toLowerCase();

    // =====================================
    // FIND LIVE SESSION
    // =====================================

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

    // =====================================
    // LOAD ALL ATHLETES
    // =====================================

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

    // =====================================
    // ATHLETE MAPPER
    // =====================================

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
                athlete
                    .competitionEntry
                    .snatchAttempts,

            cleanJerkAttempts:
                athlete
                    .competitionEntry
                    .cleanJerkAttempts,

            status,

        };

    };

    // =====================================
    // CURRENT ATHLETE
    //
    // ONLY manually selected athlete.
    //
    // If currentEntryId is null:
    // currentAthlete = null
    // =====================================

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

    // =====================================
    // DETERMINE CURRENT ATHLETE'S
    // SELECTION STATE
    // =====================================

    let canSelectAnotherAthlete =
        true;

    let currentAthleteAttempt =
        null;

    if (currentEntry) {

        currentAthleteAttempt =
            getCurrentAttempt(
                currentEntry.competitionEntry
            );

        // ---------------------------------
        // CURRENT ATHLETE HAS COMPLETED
        // THE ENTIRE COMPETITION
        //
        // Another athlete can be selected.
        // ---------------------------------

        if (
            currentAthleteAttempt.completed
        ) {

            canSelectAnotherAthlete =
                true;

        }

        // ---------------------------------
        // CURRENT ATHLETE'S NEXT ATTEMPT
        // BELONGS TO A DIFFERENT PHASE
        //
        // Example:
        //
        // Session = SNATCH
        // Athlete finished S3
        // Athlete's next attempt = CJ1
        //
        // Do NOT force the athlete to remain
        // selected because CJ has not started.
        //
        // Another Snatch athlete can be
        // selected.
        // ---------------------------------

        else if (
            currentAthleteAttempt.phase !==
            session.currentPhase
        ) {

            canSelectAnotherAthlete =
                true;

        }

        // ---------------------------------
        // CURRENT ATHLETE STILL HAS AN
        // ATTEMPT IN THE CURRENT PHASE
        // ---------------------------------

        else {

            const declaredWeight =
                currentAthleteAttempt
                    .declaredWeight;

            // ---------------------------------
            // Next declaration has NOT been
            // saved yet.
            //
            // Keep athlete selection locked.
            // ---------------------------------

            if (
                declaredWeight == null ||
                Number(declaredWeight) <= 0
            ) {

                canSelectAnotherAthlete =
                    false;

            }

            // ---------------------------------
            // Next declaration has already
            // been saved.
            //
            // Official can now select another
            // athlete.
            // ---------------------------------

            else {

                canSelectAnotherAthlete =
                    true;

            }

        }

    }

    // =====================================
    // TV SCOREBOARD
    //
    // COMPLETE COMPETITION LIST
    // =====================================

    const competitionResults =
        entries.map(
            (entry) => {

                const attempt =
                    getCurrentAttempt(
                        entry.competitionEntry
                    );

                let status =
                    "WAITING";

                // ---------------------------------
                // CURRENT ATHLETE
                // ---------------------------------

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

                // ---------------------------------
                // COMPLETED ATHLETE
                // ---------------------------------

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

    // =====================================
    // OFFICIAL ATHLETE LIST
    //
    // IMPORTANT:
    //
    // This is NOT a queue.
    //
    // It is the COMPLETE list of athletes.
    //
    // The official decides who goes next.
    // =====================================

    const athletes =
        entries.map(
            (entry) => {

                const attempt =
                    getCurrentAttempt(
                        entry.competitionEntry
                    );

                let status =
                    "AVAILABLE";

                // ---------------------------------
                // CURRENT ATHLETE
                // ---------------------------------

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

                // ---------------------------------
                // COMPLETED
                // ---------------------------------

                else if (
                    attempt.completed
                ) {

                    status =
                        "COMPLETED";

                }

                // ---------------------------------
                // WRONG PHASE
                //
                // Keep athlete visible.
                //
                // selectOfficialAthlete()
                // remains the final authority.
                // ---------------------------------

                else if (
                    attempt.phase !==
                    session.currentPhase
                ) {

                    status =
                        "WRONG_PHASE";

                }

                return mapAthlete(
                    entry,
                    status
                );

            }
        );

    // =====================================
    // DEBUG
    // =====================================

    console.log(
        "===================================="
    );

    console.log(
        "GET LIVE COMPETITION"
    );

    console.log(
        "Competition ID:",
        competitionId.toString()
    );

    console.log(
        "Gender:",
        normalizedGender
    );

    console.log(
        "Current Phase:",
        session.currentPhase
    );

    console.log(
        "Current Entry:",
        session.currentEntryId
            ?.toString() ??
        "NONE"
    );

    console.log(
        "Current Athlete:",
        currentEntry?.name ??
        "NONE"
    );

    console.log(
        "Current Athlete Attempt:",
        currentAthleteAttempt
    );

    console.log(
        "Can Select Another Athlete:",
        canSelectAnotherAthlete
    );

    console.log(
        "Total Athletes:",
        athletes.length
    );

    console.log(
        "===================================="
    );

    // =====================================
    // FINAL RESPONSE
    // =====================================

    return {

        status:
            session.status,

        sessionName:
            session.sessionName,

        selectedWeightCategories:
            session.selectedWeightCategories,

        currentPhase:
            session.currentPhase,

        // ---------------------------------
        // MANUALLY SELECTED ATHLETE
        // ---------------------------------

        currentAthlete:
            currentEntry
                ? mapAthlete(
                      currentEntry,
                      "ON_PLATFORM"
                  )
                : null,

        // ---------------------------------
        // IMPORTANT:
        //
        // Frontend uses this to determine
        // whether another athlete can be
        // selected.
        // ---------------------------------

        canSelectAnotherAthlete,

        // ---------------------------------
        // COMPLETE OFFICIAL ATHLETE LIST
        // ---------------------------------

        athletes,

        // ---------------------------------
        // TV SCOREBOARD
        // ---------------------------------

        competitionResults,

        // ---------------------------------
        // COMPATIBILITY
        //
        // Keep this temporarily so any
        // old frontend code does not crash.
        //
        // It is NOT an automatic queue.
        // ---------------------------------

        declarationQueue:
            athletes,

        // ---------------------------------
        // TOTAL
        // ---------------------------------

        totalAthletes:
            athletes.length,

    };
};

export default getLiveCompetition;