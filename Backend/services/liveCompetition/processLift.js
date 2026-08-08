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
    // Find live competition session
    // -----------------------------------

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

    // -----------------------------------
    // Verify this athlete is actually
    // the athlete selected by the official
    // -----------------------------------

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

    // -----------------------------------
    // Find current attempt
    // -----------------------------------

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

    // -----------------------------------
    // Verify phase
    // -----------------------------------

    if (
        currentAttempt.phase !==
        session.currentPhase
    ) {
        throw new Error(
            `Athlete attempt is ${currentAttempt.phase}, but live session is in ${session.currentPhase}.`
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
    // Prevent duplicate result
    // -----------------------------------

    if (
        attempt.result !== "PENDING"
    ) {
        throw new Error(
            "This attempt has already been judged."
        );
    }

    // -----------------------------------
    // Save official result
    //
    // Attempt 1 can use opening weight
    // even when declaredWeight is null.
    // -----------------------------------

    attempt.result =
        result;

    // -----------------------------------
    // Record actual completion time
    // -----------------------------------

    attempt.completedAt =
        new Date();

    await competitionEntry.save();

    // -----------------------------------
    // Logging
    // -----------------------------------

    console.log(
        "===================================="
    );

    console.log(
        "PROCESS LIFT"
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
    //
    // Calculates:
    // Best Snatch
    // Best Clean & Jerk
    // Total
    // Rank
    // -----------------------------------

    await updateCompetitionResults(
        entryId
    );

    // -----------------------------------
    // IMPORTANT
    //
    // DO NOT automatically select another
    // athlete.
    //
    // The official must manually select
    // the next athlete.
    // -----------------------------------

    session.currentEntryId =
        null;

    // -----------------------------------
    // If this was the final lift of the
    // entire competition, the session can
    // be marked FINISHED.
    //
    // Otherwise keep it RUNNING.
    // -----------------------------------

    const updatedEntry =
        await CompetitionEntry.findById(
            entryId
        );

    if (!updatedEntry) {
        throw new Error(
            "Competition entry could not be reloaded."
        );
    }

    const updatedAttempt =
        getCurrentAttempt(
            updatedEntry
        );

    if (
        updatedAttempt.completed
    ) {

        console.log(
            "Athlete has completed the entire competition."
        );

    }

    session.status =
        "RUNNING";

    await session.save();

    console.log(
        "===== PLATFORM CLEARED ====="
    );

    console.log(
        "Current Entry:",
        session.currentEntryId
            ?.toString() ??
            "NONE"
    );

    console.log(
        "Next athlete:",
        "MANUAL SELECTION REQUIRED"
    );

    // -----------------------------------
    // Return updated state
    // -----------------------------------

    return {
        athlete:
            updatedEntry,

        session,
    };
};

export default processLift;