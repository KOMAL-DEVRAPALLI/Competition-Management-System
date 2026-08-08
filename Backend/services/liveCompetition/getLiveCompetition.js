import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";


const getLiveCompetition = async (
    competitionId,
    gender
) => {

    // =====================================
    // VALIDATE INPUT
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


    // =====================================
    // NORMALIZE GENDER
    // =====================================

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
    // CURRENT ENTRY LOOKUP
    //
    // Map gives O(1) lookup instead of
    // entries.find() every time.
    // =====================================

    const entryMap =
        new Map(
            entries.map(
                (entry) => [
                    entry.entryId.toString(),
                    entry,
                ]
            )
        );


    const currentEntry =
        session.currentEntryId
            ? entryMap.get(
                  session.currentEntryId
                      .toString()
              ) ?? null
            : null;


    // =====================================
    // ATHLETE MAPPER
    //
    // currentAttempt is passed in instead
    // of calculating it repeatedly.
    // =====================================

    const mapAthlete = (
        athlete,
        currentAttempt,
        status = "WAITING"
    ) => {

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
    // BUILD BOTH LISTS IN ONE PASS
    //
    // BEFORE:
    //
    // entries.map() → competitionResults
    // entries.map() → athletes
    //
    // NOW:
    //
    // ONE LOOP → both lists
    //
    // Also calculate currentAttempt only
    // once for each athlete.
    // =====================================

    const competitionResults = [];
    const athletes = [];


    // =====================================
    // CURRENT ATHLETE STATE
    // =====================================

    let canSelectAnotherAthlete = true;

    let currentAthleteAttempt = null;


    // =====================================
    // PROCESS ATHLETES ONCE
    // =====================================

    for (
        const entry of entries
    ) {

        const attempt =
            getCurrentAttempt(
                entry.competitionEntry
            );


        // =================================
        // TV SCOREBOARD STATUS
        // =================================

        let scoreboardStatus =
            "WAITING";


        if (
            session.currentEntryId &&
            entry.entryId
                .toString() ===
            session.currentEntryId
                .toString()
        ) {

            scoreboardStatus =
                "ON_PLATFORM";

        }
        else if (
            attempt.completed
        ) {

            scoreboardStatus =
                "COMPLETED";

        }


        // =================================
        // OFFICIAL LIST STATUS
        // =================================

        let officialStatus =
            "AVAILABLE";


        if (
            session.currentEntryId &&
            entry.entryId
                .toString() ===
            session.currentEntryId
                .toString()
        ) {

            officialStatus =
                "ON_PLATFORM";

        }
        else if (
            attempt.completed
        ) {

            officialStatus =
                "COMPLETED";

        }
        else if (
            attempt.phase !==
            session.currentPhase
        ) {

            officialStatus =
                "WRONG_PHASE";

        }


        // =================================
        // BUILD SCOREBOARD ENTRY
        // =================================

        competitionResults.push(
            mapAthlete(
                entry,
                attempt,
                scoreboardStatus
            )
        );


        // =================================
        // BUILD OFFICIAL ENTRY
        // =================================

        athletes.push(
            mapAthlete(
                entry,
                attempt,
                officialStatus
            )
        );


        // =================================
        // CURRENT ATHLETE
        // =================================

        if (
            currentEntry &&
            entry.entryId
                .toString() ===
            currentEntry.entryId
                .toString()
        ) {

            currentAthleteAttempt =
                attempt;


            // -----------------------------
            // CURRENT ATHLETE COMPLETED
            // -----------------------------

            if (
                attempt.completed
            ) {

                canSelectAnotherAthlete =
                    true;

            }


            // -----------------------------
            // NEXT ATTEMPT IS DIFFERENT
            // PHASE
            // -----------------------------

            else if (
                attempt.phase !==
                session.currentPhase
            ) {

                canSelectAnotherAthlete =
                    true;

            }


            // -----------------------------
            // CURRENT PHASE
            // -----------------------------

            else {

                const declaredWeight =
                    attempt.declaredWeight;


                // -------------------------
                // Declaration not saved
                // -------------------------

                if (
                    declaredWeight == null ||
                    Number(declaredWeight) <= 0
                ) {

                    canSelectAnotherAthlete =
                        false;

                }


                // -------------------------
                // Declaration saved
                // -------------------------

                else {

                    canSelectAnotherAthlete =
                        true;

                }

            }

        }

    }


    // =====================================
    // CURRENT ATHLETE
    // =====================================

    const currentAthlete =
        currentEntry
            ? mapAthlete(
                  currentEntry,
                  currentAthleteAttempt,
                  "ON_PLATFORM"
              )
            : null;


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
        // CURRENT ATHLETE
        // ---------------------------------

        currentAthlete,

        // ---------------------------------
        // SELECTION CONTROL
        // ---------------------------------

        canSelectAnotherAthlete,

        // ---------------------------------
        // OFFICIAL ATHLETE LIST
        // ---------------------------------

        athletes,

        // ---------------------------------
        // TV SCOREBOARD
        // ---------------------------------

        competitionResults,

        // ---------------------------------
        // COMPATIBILITY
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