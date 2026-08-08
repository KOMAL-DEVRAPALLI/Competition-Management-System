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
    // VALIDATE GENDER
    // =====================================

    if (!gender) {
        throw new Error(
            "Gender is required."
        );
    }


    const normalizedGender =
        gender.toLowerCase();


    // =====================================
    // LOAD ENTRY + SESSION IN PARALLEL
    //
    // These two queries are independent.
    // Running them together reduces waiting
    // time for every lift.
    // =====================================

    const [
        competitionEntry,
        session,
    ] = await Promise.all([

        CompetitionEntry.findById(
            entryId
        ),

        LiveCompetition.findOne({
            competitionId,
            gender: normalizedGender,
        }),

    ]);


    // =====================================
    // VALIDATE COMPETITION ENTRY
    // =====================================

    if (!competitionEntry) {
        throw new Error(
            "Competition entry not found."
        );
    }


    // =====================================
    // VALIDATE LIVE SESSION
    // =====================================

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
    // UPDATE RESULTS + RANKING
    //
    // updateCompetitionResults()
    // returns the updated entry.
    //
    // Reuse that document instead of
    // querying CompetitionEntry again here.
    // =====================================

    const updatedEntry =
        await updateCompetitionResults(
            entryId
        );


    // =====================================
    // DETERMINE ATHLETE'S NEXT ATTEMPT
    // =====================================

    const nextAttempt =
        getCurrentAttempt(
            updatedEntry
        );


    // =====================================
    // CASE 1
    //
    // ATHLETE HAS ANOTHER ATTEMPT
    // IN THE SAME PHASE.
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
    // UNTIL ENTIRE SNATCH SESSION IS
    // COMPLETE.
    // =====================================

    if (
        currentAttempt.phase ===
            "SNATCH" &&
        nextAttempt.phase ===
            "CLEAN_JERK"
    ) {

        // ---------------------------------
        // Load competition entries.
        //
        // lean() is used because these
        // documents are only being read.
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
                })
                .lean();


        // ---------------------------------
        // Determine athletes in the
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


        // =================================
        // SNATCH STILL IN PROGRESS
        //
        // Keep current athlete selected.
        //
        // Another athlete can be selected
        // manually by the official.
        // =================================

        if (!allSnatchCompleted) {

            session.currentPhase =
                "SNATCH";

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
        }


        // =================================
        // ALL ATHLETES FINISHED SNATCH
        //
        // Move competition phase to
        // CLEAN & JERK.
        //
        // Keep current athlete selected.
        //
        // Official can manually select
        // the first CJ athlete.
        // =================================

        session.currentPhase =
            "CLEAN_JERK";

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
                true,

        };
    }


    // =====================================
    // CASE 3
    //
    // ATHLETE COMPLETED ENTIRE
    // COMPETITION.
    //
    // KEEP ATHLETE SELECTED.
    //
    // Official can select another athlete.
    // =====================================

    if (
        nextAttempt.completed
    ) {

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