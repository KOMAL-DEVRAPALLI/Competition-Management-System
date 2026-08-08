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

    // -----------------------------------
    // Find competition entry
    // -----------------------------------

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
    // Find current attempt
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
    // Save official result
    //
    // Attempt 1 may use the opening
    // weight without declaredWeight.
    // Therefore, do NOT require
    // declaredWeight here.
    // -----------------------------------

    attempt.result = result;

    // -----------------------------------
    // Record actual completion time
    //
    // This represents when the official
    // judged the attempt GOOD / NO_LIFT.
    //
    // Used later for competition
    // calling-order calculations.
    // -----------------------------------

    attempt.completedAt =
        new Date();

    await competitionEntry.save();

    // -----------------------------------
    // Logging
    // -----------------------------------

    console.log(
        "===== PROCESS LIFT ====="
    );

    console.log(
        "Entry:",
        competitionEntry
            ._id
            .toString()
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

    console.log(
        "Completed At:",
        attempt.completedAt
    );

    // -----------------------------------
    // Update athlete results
    // -----------------------------------

    await updateCompetitionResults(
        entryId
    );

    // -----------------------------------
    // Advance competition
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