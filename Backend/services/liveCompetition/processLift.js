import CompetitionEntry from "../../models/CompetitionEntry.js";
import updateCompetitionResults from "../calculations/updateCompetitionResults.js";
import getCurrentAttempt from "./getCurrentAttempt.js";
import advanceCompetition from "./advanceCompetition.js";

const processLift = async ({
    entryId,
    competitionId,
    gender,
    result,
}) => {

    // -----------------------------------
    // Validate result
    // -----------------------------------

    if (
        result !== "GOOD" &&
        result !== "NO_LIFT"
    ) {
        throw new Error(
            "Invalid lift result."
        );
    }

    const competitionEntry =
        await CompetitionEntry.findById(
            entryId
        );

    if (!competitionEntry) {
        throw new Error(
            "Competition entry not found."
        );
    }

    // -----------------------------------
    // Find the current attempt
    // -----------------------------------

    const currentAttempt =
        getCurrentAttempt(
            competitionEntry
        );

    if (currentAttempt.completed) {
        throw new Error(
            "Athlete has already completed the competition."
        );
    }

    // -----------------------------------
    // Select correct attempt array
    // -----------------------------------

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

    // -----------------------------------
    // Result can only be recorded for
    // a declared attempt
    // -----------------------------------

    if (
        attempt.declaredWeight == null
    ) {
        throw new Error(
            "Cannot record lift result before declaration."
        );
    }

    // -----------------------------------
    // Save official result
    // -----------------------------------

    attempt.result = result;

    await competitionEntry.save();

    console.log(
        "===== PROCESS LIFT ====="
    );

    console.log(
        "Entry:",
        competitionEntry._id.toString()
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
        attempt.declaredWeight
    );

    console.log(
        "Result:",
        result
    );

    // -----------------------------------
    // Update athlete results
    // -----------------------------------

    await updateCompetitionResults(
        entryId
    );

    // -----------------------------------
    // Advance competition
    //
    // advanceCompetition() determines
    // whether:
    //
    // 1. The athlete returns for the
    //    next declared attempt.
    //
    // 2. Another athlete goes next.
    //
    // 3. Platform remains empty waiting
    //    for a declaration.
    //
    // 4. Phase changes to Clean & Jerk.
    // -----------------------------------

    await advanceCompetition(
        competitionId,
        gender.toLowerCase()
    );

    // -----------------------------------
    // Return updated athlete
    // -----------------------------------

    return await CompetitionEntry.findById(
        entryId
    );
};

export default processLift;