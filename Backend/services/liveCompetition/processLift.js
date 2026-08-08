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
    // LOAD ENTRY + LIVE SESSION
    // IN PARALLEL
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
    // VALIDATE ENTRY
    // =====================================

    if (!competitionEntry) {
        throw new Error(
            "Competition entry not found."
        );
    }


    // =====================================
    // VALIDATE SESSION
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
    // SAVE RESULT IN MEMORY
    //
    // IMPORTANT:
    //
    // Do NOT save here.
    //
    // updateCompetitionResults()
    // will calculate the results and perform
    // the ONE CompetitionEntry save.
    // =====================================

    attempt.result =
        result;

    attempt.completedAt =
        new Date();


    // =====================================
    // UPDATE RESULTS
    //
    // The already-loaded document is passed
    // directly.
    //
    // No second findById().
    // No duplicate CompetitionEntry.save().
    // =====================================

    const updatedEntry =
        await updateCompetitionResults(
            competitionEntry
        );


    // =====================================
    // DETERMINE NEXT ATTEMPT
    // =====================================

    const nextAttempt =
        getCurrentAttempt(
            updatedEntry
        );


    // =====================================
    // CASE 1
    //
    // SAME PHASE CONTINUES
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
    // NEXT PHASE = CLEAN & JERK
    //
    // Do not start CJ for this athlete
    // until ALL athletes have completed
    // their Snatch attempts.
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
        // lean() because these documents
        // are only being inspected.
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
        // Determine athletes participating
        // in this live session.
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
        // CHECK ALL SNATCH COMPLETED
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
        // Official may select another
        // athlete manually.
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
        // ALL SNATCH COMPLETED
        //
        // MOVE TO CLEAN & JERK.
        //
        // Keep current athlete selected.
        // Official chooses CJ athlete.
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
    // ATHLETE COMPLETED ENTIRE COMPETITION
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