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
    // DETERMINE NEXT ATTEMPT
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
        "NEXT ATTEMPT:",
        nextAttempt
    );

    // =====================================
    // IMPORTANT
    //
    // DO NOT CLEAR CURRENT ATHLETE YET.
    //
    // The same athlete remains selected
    // for the next attempt.
    // =====================================

    if (
        !nextAttempt.completed
    ) {

        // ---------------------------------
        // SAME ATHLETE REMAINS ON PLATFORM
        // ---------------------------------

        session.currentEntryId =
            updatedEntry._id;

        session.currentPhase =
            nextAttempt.phase;

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
            "Next Phase:",
            nextAttempt.phase
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
    // ATHLETE COMPLETED ENTIRE COMPETITION
    // =====================================

    session.currentEntryId =
        null;

    session.status =
        "RUNNING";

    await session.save();

    console.log(
        "===== ATHLETE COMPLETED ====="
    );

    console.log(
        "Platform cleared."
    );

    console.log(
        "Manual selection required."
    );

    return {
        athlete:
            updatedEntry,

        session,

        nextAttempt,

        platformCleared:
            true,

        manualSelectionRequired:
            true,
    };
};

export default processLift;