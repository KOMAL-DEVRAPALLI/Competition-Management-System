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

    console.log(
        "===== GET LIVE COMPETITION ====="
    );

    console.log(
        "Current Entry ID:",
        session.currentEntryId?.toString()
    );

    console.log(
        "Prepare Entry ID:",
        session.prepareEntryId?.toString()
    );

    console.log(
        "Current Phase:",
        session.currentPhase
    );

    const entries = await buildWorkingSheetData(
        competitionId,
        gender,
        true,
        session.selectedWeightCategories
    );

    if (!entries.length) {
        throw new Error(
            "No athletes found."
        );
    }

    // -----------------------------------
    // CURRENT PLATFORM ATHLETE
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
    // PREPARE ATHLETE
    // -----------------------------------

    const prepareEntry =
        session.prepareEntryId
            ? entries.find(
                  (entry) =>
                      entry.entryId
                          .toString() ===
                      session.prepareEntryId
                          .toString()
              )
            : null;

    // -----------------------------------
    // Find the last completed attempt
    // for the athlete who just lifted.
    //
    // This is used ONLY for display
    // while the platform is temporarily
    // empty waiting for declaration.
    // -----------------------------------

    const findLastCompletedAttempt = (
        competitionEntry
    ) => {

        const completedSnatches =
            competitionEntry.snatchAttempts
                .filter(
                    (attempt) =>
                        attempt.result ===
                            "GOOD" ||
                        attempt.result ===
                            "NO_LIFT"
                );

        const completedCleanJerks =
            competitionEntry.cleanJerkAttempts
                .filter(
                    (attempt) =>
                        attempt.result ===
                            "GOOD" ||
                        attempt.result ===
                            "NO_LIFT"
                );

        const allCompletedAttempts = [
            ...completedSnatches.map(
                (attempt) => ({
                    ...attempt.toObject?.() ??
                        attempt,
                    phase: "SNATCH",
                })
            ),

            ...completedCleanJerks.map(
                (attempt) => ({
                    ...attempt.toObject?.() ??
                        attempt,
                    phase: "CLEAN_JERK",
                })
            ),
        ];

        if (
            !allCompletedAttempts.length
        ) {
            return null;
        }

        // Attempts are sequential, so the
        // highest completed phase/attempt
        // represents the latest completed lift.
        const phaseOrder = {
            SNATCH: 1,
            CLEAN_JERK: 2,
        };

        allCompletedAttempts.sort(
            (a, b) => {

                if (
                    phaseOrder[a.phase] !==
                    phaseOrder[b.phase]
                ) {
                    return (
                        phaseOrder[a.phase] -
                        phaseOrder[b.phase]
                    );
                }

                return (
                    a.attemptNo -
                    b.attemptNo
                );

            }
        );

        return (
            allCompletedAttempts[
                allCompletedAttempts.length - 1
            ] ?? null
        );

    };

    // -----------------------------------
    // Athlete mapper
    // -----------------------------------

    const mapAthlete = (
        athlete,
        status = "WAITING",
        overrideAttempt = null
    ) => {

        const attempt =
            overrideAttempt ??
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
                attempt,

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
    // CURRENT ATHLETE LOG
    // -----------------------------------

    if (currentEntry) {

        const currentAttempt =
            getCurrentAttempt(
                currentEntry.competitionEntry
            );

        console.log(
            "CURRENT ATHLETE FOUND:"
        );

        console.log(
            "Entry:",
            currentEntry.entryId.toString()
        );

        console.log(
            "Name:",
            currentEntry.name
        );

        console.log(
            "Phase:",
            currentAttempt.phase
        );

        console.log(
            "Attempt:",
            currentAttempt.attemptNo
        );

        console.log(
            "Declared Weight:",
            currentAttempt.declaredWeight
        );

    } else {

        console.log(
            "NO CURRENT ATHLETE FOUND."
        );

    }

    // -----------------------------------
    // LAST COMPLETED LIFT
    //
    // Only create this when there is
    // no athlete currently on platform.
    // -----------------------------------

    let lastLiftAthlete = null;

    if (
        !currentEntry &&
        prepareEntry
    ) {

        const lastCompletedAttempt =
            findLastCompletedAttempt(
                prepareEntry.competitionEntry
            );

        if (lastCompletedAttempt) {

            lastLiftAthlete =
                mapAthlete(
                    prepareEntry,
                    "LAST_LIFT",
                    {
                        completed: true,

                        phase:
                            lastCompletedAttempt.phase,

                        attemptNo:
                            lastCompletedAttempt.attemptNo,

                        declaredWeight:
                            lastCompletedAttempt
                                .declaredWeight,

                        declaredAt:
                            lastCompletedAttempt
                                .declaredAt,

                        result:
                            lastCompletedAttempt
                                .result,

                    }
                );

            console.log(
                "===== LAST COMPLETED LIFT ====="
            );

            console.log(
                "Entry:",
                prepareEntry.entryId.toString()
            );

            console.log(
                "Name:",
                prepareEntry.name
            );

            console.log(
                "Phase:",
                lastCompletedAttempt.phase
            );

            console.log(
                "Attempt:",
                lastCompletedAttempt.attemptNo
            );

            console.log(
                "Result:",
                lastCompletedAttempt.result
            );

            console.log(
                "Weight:",
                lastCompletedAttempt.declaredWeight
            );

        }

    }

    // -----------------------------------
    // Find athletes eligible to become
    // NEXT athlete
    // -----------------------------------

    const eligibleEntries =
        entries.filter((entry) => {

            const attempt =
                getCurrentAttempt(
                    entry.competitionEntry
                );

            const isCurrent =
                session.currentEntryId &&
                entry.entryId.toString() ===
                    session.currentEntryId
                        .toString();

            return (
                !isCurrent &&
                !attempt.completed &&
                attempt.phase ===
                    session.currentPhase &&
                attempt.declaredWeight != null
            );

        });

    console.log(
        "Eligible Next Athletes:",
        eligibleEntries.length
    );

    // -----------------------------------
    // Select NEXT athlete
    // -----------------------------------

    const nextEntry =
        selectNextAthlete(
            eligibleEntries
        );

    if (nextEntry) {

        const nextAttempt =
            getCurrentAttempt(
                nextEntry.competitionEntry
            );

        console.log(
            "NEXT ATHLETE:"
        );

        console.log(
            "Entry:",
            nextEntry.entryId.toString()
        );

        console.log(
            "Name:",
            nextEntry.name
        );

        console.log(
            "Phase:",
            nextAttempt.phase
        );

        console.log(
            "Attempt:",
            nextAttempt.attemptNo
        );

        console.log(
            "Declared Weight:",
            nextAttempt.declaredWeight
        );

    } else {

        console.log(
            "NO NEXT ATHLETE."
        );

    }

    // -----------------------------------
    // Competition results
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

                if (
                    attempt.completed
                ) {

                    status =
                        "COMPLETED";

                } else if (
                    session.currentEntryId &&
                    entry.entryId.toString() ===
                        session.currentEntryId
                            .toString()
                ) {

                    status =
                        "ON_PLATFORM";

                } else if (
                    nextEntry &&
                    entry.entryId.toString() ===
                        nextEntry.entryId
                            .toString()
                ) {

                    status =
                        "NEXT";

                }

                return mapAthlete(
                    entry,
                    status
                );

            }
        );

    // -----------------------------------
    // Declaration queue
    // -----------------------------------

    const declarationQueue =
        entries
            .filter((entry) => {

                const attempt =
                    getCurrentAttempt(
                        entry.competitionEntry
                    );

                const isCurrent =
                    session.currentEntryId &&
                    entry.entryId.toString() ===
                        session.currentEntryId
                            .toString();

                const isPrepare =
                    session.prepareEntryId &&
                    entry.entryId.toString() ===
                        session.prepareEntryId
                            .toString();

                return (
                    !attempt.completed &&
                    attempt.phase ===
                        session.currentPhase &&
                    !isCurrent &&
                    !isPrepare
                );

            })
            .map((entry) =>
                mapAthlete(entry)
            );

    // -----------------------------------
    // Final response
    // -----------------------------------

    const response = {

        status:
            session.status,

        sessionName:
            session.sessionName,

        selectedWeightCategories:
            session.selectedWeightCategories,

        currentPhase:
            session.currentPhase,

        // REAL platform athlete
        currentAthlete:
            currentEntry
                ? mapAthlete(
                      currentEntry,
                      "ON_PLATFORM"
                  )
                : null,

        // Athlete preparing next attempt
        prepareAthlete:
            prepareEntry
                ? mapAthlete(
                      prepareEntry,
                      "PREPARE"
                  )
                : null,

        // Last completed lift for display
        lastLiftAthlete,

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

    console.log(
        "FINAL CURRENT ATHLETE:",
        response.currentAthlete
            ? {
                  entryId:
                      response.currentAthlete
                          .entryId
                          .toString(),

                  name:
                      response.currentAthlete
                          .name,

                  phase:
                      response.currentAthlete
                          .currentAttempt
                          ?.phase,

                  attempt:
                      response.currentAthlete
                          .currentAttempt
                          ?.attemptNo,

                  declaredWeight:
                      response.currentAthlete
                          .currentAttempt
                          ?.declaredWeight,
              }
            : null
    );

    console.log(
        "FINAL LAST LIFT:",
        response.lastLiftAthlete
            ? {
                  entryId:
                      response.lastLiftAthlete
                          .entryId
                          .toString(),

                  name:
                      response.lastLiftAthlete
                          .name,

                  phase:
                      response.lastLiftAthlete
                          .currentAttempt
                          ?.phase,

                  attempt:
                      response.lastLiftAthlete
                          .currentAttempt
                          ?.attemptNo,

                  result:
                      response.lastLiftAthlete
                          .currentAttempt
                          ?.result,

                  declaredWeight:
                      response.lastLiftAthlete
                          .currentAttempt
                          ?.declaredWeight,
              }
            : null
    );

    return response;
};

export default getLiveCompetition;