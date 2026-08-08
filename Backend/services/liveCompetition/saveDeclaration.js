import CompetitionEntry from "../../models/CompetitionEntry.js";
import getCurrentAttempt from "./getCurrentAttempt.js";

const saveDeclaration = async ({
    entryId,
    declaredWeight,
}) => {

    // -----------------------------------
    // Validate declared weight
    // -----------------------------------

    if (
        declaredWeight == null ||
        declaredWeight <= 0
    ) {
        throw new Error(
            "Invalid declared weight."
        );
    }

    const weight =
        Number(declaredWeight);

    if (
        Number.isNaN(weight) ||
        weight <= 0
    ) {
        throw new Error(
            "Invalid declared weight."
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
    // Determine athlete's next attempt
    // -----------------------------------

    const currentAttempt =
        getCurrentAttempt(
            competitionEntry
        );

    if (
        currentAttempt.completed
    ) {
        throw new Error(
            "Athlete has completed the competition."
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
    // Prevent changing an already
    // completed attempt
    // -----------------------------------

    if (
        attempt.result !== "PENDING"
    ) {
        throw new Error(
            "This attempt has already been completed."
        );
    }

    // -----------------------------------
    // Save / EDIT declaration
    //
    // Because the attempt is still
    // PENDING, an existing declaration
    // can be changed.
    // -----------------------------------

    attempt.declaredWeight =
        weight;

    attempt.declaredAt =
        new Date();

    await competitionEntry.save();

    // -----------------------------------
    // Logging
    // -----------------------------------

    console.log(
        "===================================="
    );

    console.log(
        "SAVE DECLARATION"
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
        "Declared At:",
        attempt.declaredAt
    );

    console.log(
        "===================================="
    );

    // -----------------------------------
    // IMPORTANT
    //
    // Declaration does NOT:
    //
    // - select athlete
    // - change currentEntryId
    // - calculate next athlete
    // - call selectNextAthlete()
    // - call updateCurrentPlatformAthlete()
    // - call advanceCompetition()
    //
    // Declaration is ONLY a declaration.
    // -----------------------------------

    return await CompetitionEntry.findById(
        entryId
    );
};

export default saveDeclaration;