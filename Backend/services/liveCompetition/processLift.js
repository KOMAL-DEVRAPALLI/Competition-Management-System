import CompetitionEntry from "../../models/CompetitionEntry.js";
import LiveCompetition from "../../models/LiveCompetition.js";
import updateCompetitionResults from "../calculations/updateCompetitionResults.js";
import getCurrentAttempt from "./getCurrentAttempt.js";

const processLift = async ({
    entryId,
    competitionId,
    gender,
    result,
}) => {

    // =====================================
    // VALIDATE RESULT
    // =====================================

    if (
        result !== "GOOD" &&
        result !== "NO_LIFT"
    ) {
        throw new Error(
            "Invalid lift result."
        );
    }

    // =====================================
    // FIND COMPETITION ENTRY
    // =====================================

    const competitionEntry =
        await CompetitionEntry.findById(
            entryId
        );

    if (!competitionEntry) {
        throw new Error(
            "Competition entry not found."
        );
    }

    // =====================================
    // FIND LIVE SESSION
    // =====================================

    if (!gender) {
        throw new Error(
            "Gender is required."
        );
    }

    const normalizedGender =
        gender.toLowerCase();

    const session =
        await LiveCompetition.findOne({
            competitionId,
            gender: normalizedGender,
        });

    if (!session) {
        throw new Error(
            "Live competition session not found."
        );
    }

    // =====================================
    // VERIFY CURRENT ATHLETE
    // =====================================

    if (
        !session.currentEntryId ||
        session.currentEntryId
            .toString() !==
        competitionEntry._id
            .toString()
    ) {
        throw new Error(
            "This athlete is not currently selected."
        );
    }

    // =====================================
    // GET CURRENT ATTEMPT
    // =====================================

    const currentAttempt =
        getCurrentAttempt(
            competitionEntry
        );

    if (
        currentAttempt.completed
    ) {
        throw new Error(
            "Athlete has already completed the competition."
        );
    }

    // =====================================
    // VERIFY PHASE
    // =====================================

    if (
        currentAttempt.phase !==
        session.currentPhase
    ) {
        throw new Error(
            `Athlete attempt is ${currentAttempt.phase}, but live session is in ${session.currentPhase}.`
        );
    }

    // =====================================
    // SELECT ATTEMPT ARRAY
    // =====================================

    const attempts =
        currentAttempt.phase === "SNATCH"
            ? competitionEntry.snatchAttempts
            : competitionEntry.cleanJerkAttempts;

    const attempt =
        attempts.find(
            (item) =>
                item.attemptNo ===
                currentAttempt.attemptNo
        );

    if (!attempt) {
        throw new Error(
            "Attempt not found."
        );
    }

    // =====================================
    // PREVENT DUPLICATE RESULT
    // =====================================

    if (
        attempt.result !== "PENDING"
    ) {
        throw new Error(
            "This attempt has already been judged."
        );
    }

    // =====================================
    // SAVE RESULT
    // =====================================

    attempt.result =
        result;

    attempt.completedAt =
        new Date();

    await competitionEntry.save();

    // =====================================
    // UPDATE RESULTS
    // =====================================

    await updateCompetitionResults(
        entryId
    );

    // =====================================
    // RELOAD ATHLETE
    // =====================================

    const updatedEntry =
        await CompetitionEntry.findById(
            entryId
        );

    if (!updatedEntry) {
        throw new Error(
            "Competition entry could not be reloaded."
        );
    }

    // =====================================
    // DETERMINE ATHLETE'S NEXT ATTEMPT
    // =====================================

    const nextAttempt =
        getCurrentAttempt(
            updatedEntry
        );

    console.log(
        "===================================="
    );

    console.log(
        "PROCESS LIFT"
    );

    console.log(
        "Athlete:",
        updatedEntry._id.toString()
    );

    console.log(
        "Finished Phase:",
        currentAttempt.phase
    );

    console.log(
        "Finished Attempt:",
        currentAttempt.attemptNo
    );

    console.log(
        "Result:",
        result
    );

    console.log(
        "Athlete Next Attempt:",
        nextAttempt
    );

    // =====================================
    // CASE 1
    //
    // ATHLETE HAS ANOTHER ATTEMPT IN
    // THE SAME PHASE
    //
    // S1 → S2
    // S2 → S3
    // CJ1 → CJ2
    // CJ2 → CJ3
    //
    // KEEP SAME ATHLETE SELECTED.
    // =====================================

    if (
        !nextAttempt.completed &&
        nextAttempt.phase ===
            session.currentPhase
    ) {

        session.currentEntryId =
            updatedEntry._id;

        session.status =
            "RUNNING";

        await session.save();

        console.log(
            "===== SAME ATHLETE CONTINUES ====="
        );

        console.log(
            "Current Entry:",
            session.currentEntryId
                .toString()
        );

        console.log(
            "Current Phase:",
            session.currentPhase
        );

        console.log(
            "Next Attempt:",
            nextAttempt.attemptNo
        );

        return {

            athlete:
                updatedEntry,

            session,

            nextAttempt,

            platformCleared:
                false,

            manualSelectionRequired:
                false,

        };
    }

    // =====================================
    // CASE 2
    //
    // ATHLETE FINISHED SNATCH
    //
    // NEXT ATTEMPT IS CLEAN & JERK.
    //
    // DO NOT START CJ FOR THIS ATHLETE
    // UNTIL THE ENTIRE SNATCH SESSION
    // IS COMPLETE.
    // =====================================

    if (
        currentAttempt.phase ===
            "SNATCH" &&
        nextAttempt.phase ===
            "CLEAN_JERK"
    ) {

        // ---------------------------------
        // Load all competition entries
        // ---------------------------------

        const sessionEntries =
            await CompetitionEntry
                .find({
                    competitionId,
                })
                .populate({
                    path: "athleteId",
                    select:
                        "personalInfo.gender",
                });

        // ---------------------------------
        // Determine athletes in this
        // live competition session.
        // ---------------------------------

        const liveEntries =
            sessionEntries.filter(
                (entry) => {

                    const athleteGender =
                        entry.athleteId
                            ?.personalInfo
                            ?.gender;

                    if (!athleteGender) {
                        return false;
                    }

                    if (
                        athleteGender
                            .toLowerCase() !==
                        normalizedGender
                    ) {
                        return false;
                    }

                    // -----------------------------
                    // Selected weight categories
                    // -----------------------------

                    if (
                        Array.isArray(
                            session
                                .selectedWeightCategories
                        ) &&
                        session
                            .selectedWeightCategories
                            .length > 0
                    ) {

                        const category =
                            entry
                                .official
                                ?.finalWeightCategory
                                ?.trim();

                        return session
                            .selectedWeightCategories
                            .includes(
                                category
                            );
                    }

                    return true;

                }
            );

        // ---------------------------------
        // Check whether ALL athletes have
        // completed all Snatch attempts.
        // ---------------------------------

        const allSnatchCompleted =
            liveEntries.every(
                (entry) => {

                    const snatchAttempts =
                        entry.snatchAttempts ||
                        [];

                    return (
                        snatchAttempts.length >=
                            3 &&
                        snatchAttempts.every(
                            (snatchAttempt) =>
                                snatchAttempt
                                    .result !==
                                "PENDING"
                        )
                    );

                }
            );

        console.log(
            "===== SNATCH PHASE CHECK ====="
        );

        console.log(
            "Live Athletes:",
            liveEntries.length
        );

        console.log(
            "All Snatch Completed:",
            allSnatchCompleted
        );

        // =================================
        // SNATCH STILL IN PROGRESS
        //
        // IMPORTANT:
        //
        // KEEP currentEntryId.
        //
        // The athlete remains selected
        // on screen.
        //
        // getLiveCompetition.js will report:
        //
        // canSelectAnotherAthlete = true
        //
        // because this athlete's next
        // phase is CLEAN_JERK while the
        // live phase is still SNATCH.
        //
        // The official can then select
        // another Snatch athlete.
        // =================================

        if (!allSnatchCompleted) {

            session.currentPhase =
                "SNATCH";

            session.currentEntryId =
                updatedEntry._id;

            session.status =
                "RUNNING";

            await session.save();

            console.log(
                "===== SNATCH STILL IN PROGRESS ====="
            );

            console.log(
                "Current athlete remains selected."
            );

            console.log(
                "Current Entry:",
                session.currentEntryId
                    .toString()
            );

            console.log(
                "Other athletes still have Snatch attempts."
            );

            console.log(
                "Clean & Jerk has NOT started."
            );

            return {

                athlete:
                    updatedEntry,

                session,

                nextAttempt,

                platformCleared:
                    false,

                manualSelectionRequired:
                    true,

                phaseTransitioned:
                    false,

            };
        }

        // =================================
        // ALL ATHLETES FINISHED SNATCH
        //
        // Move competition phase to
        // CLEAN & JERK.
        //
        // IMPORTANT:
        //
        // Keep current athlete selected.
        //
        // Official can manually replace
        // this athlete with the athlete
        // who should perform CJ1.
        // =================================

        session.currentPhase =
            "CLEAN_JERK";

        session.currentEntryId =
            updatedEntry._id;

        session.status =
            "RUNNING";

        await session.save();

        console.log(
            "===== SNATCH COMPLETE ====="
        );

        console.log(
            "Competition phase changed to CLEAN_JERK."
        );

        console.log(
            "Current athlete remains selected."
        );

        console.log(
            "Official may now select the first CJ athlete."
        );

        return {

            athlete:
                updatedEntry,

            session,

            nextAttempt,

            platformCleared:
                false,

            manualSelectionRequired:
                true,

            phaseTransitioned:
                true,

        };
    }

    // =====================================
    // CASE 3
    //
    // ATHLETE HAS COMPLETED ENTIRE
    // COMPETITION.
    //
    // KEEP ATHLETE SELECTED.
    //
    // The selection service / frontend
    // will allow the official to choose
    // another eligible athlete.
    // =====================================

    if (
        nextAttempt.completed
    ) {

        session.currentEntryId =
            updatedEntry._id;

        session.status =
            "RUNNING";

        await session.save();

        console.log(
            "===== ATHLETE COMPLETED ====="
        );

        console.log(
            "Current athlete remains selected."
        );

        console.log(
            "Official may select another athlete."
        );

        return {

            athlete:
                updatedEntry,

            session,

            nextAttempt,

            platformCleared:
                false,

            manualSelectionRequired:
                true,

            phaseTransitioned:
                false,

        };
    }

    // =====================================
    // SAFETY FALLBACK
    //
    // Keep current athlete selected.
    // =====================================

    session.currentEntryId =
        updatedEntry._id;

    session.status =
        "RUNNING";

    await session.save();

    return {

        athlete:
            updatedEntry,

        session,

        nextAttempt,

        platformCleared:
            false,

        manualSelectionRequired:
            true,

        phaseTransitioned:
            false,

    };
};

export default processLift;