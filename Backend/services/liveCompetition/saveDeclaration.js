import CompetitionEntry from "../../models/CompetitionEntry.js";
import LiveCompetition from "../../models/LiveCompetition.js";
import getCurrentAttempt from "./getCurrentAttempt.js";
import updateCurrentPlatformAthlete from "./updateCurrentPlatformAthlete.js";

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
    // Determine current attempt
    // -----------------------------------

    const currentAttempt =
        getCurrentAttempt(
            competitionEntry
        );

    if (currentAttempt.completed) {
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
    // Save declaration
    //
    // IMPORTANT:
    //
    // declaredAt represents the time
    // at which the official entered/
    // updated this declaration.
    //
    // This timestamp is later used by
    // selectNextAthlete() when two
    // athletes have the same weight.
    // -----------------------------------

    const declarationTime =
        new Date();

    attempt.declaredWeight =
        Number(declaredWeight);

    attempt.declaredAt =
        declarationTime;

    await competitionEntry.save();

    // -----------------------------------
    // Populate athlete
    // -----------------------------------

    await competitionEntry.populate(
        "athleteId"
    );

    const gender =
        competitionEntry
            .athleteId
            ?.personalInfo
            ?.gender;

    if (!gender) {
        throw new Error(
            "Athlete gender is missing."
        );
    }

    const normalizedGender =
        gender.toLowerCase();

    // -----------------------------------
    // Debug declaration
    // -----------------------------------

    console.log(
        "===== SAVE DECLARATION ====="
    );

    console.log(
        "Competition ID:",
        competitionEntry
            .competitionId
            .toString()
    );

    console.log(
        "Entry ID:",
        competitionEntry
            ._id
            .toString()
    );

    console.log(
        "Gender:",
        normalizedGender
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

    // -----------------------------------
    // Try to place athlete on platform
    //
    // If platform is occupied,
    // updateCurrentPlatformAthlete()
    // will leave the current athlete
    // unchanged.
    //
    // If platform is empty, the newly
    // declared athlete can be selected
    // according to lifting order.
    // -----------------------------------

    await updateCurrentPlatformAthlete(
        competitionEntry.competitionId,
        normalizedGender,
        competitionEntry._id
    );

    // -----------------------------------
    // Check actual platform state
    // -----------------------------------

    const session =
        await LiveCompetition.findOne({
            competitionId:
                competitionEntry
                    .competitionId,

            gender:
                normalizedGender,
        });

    if (!session) {
        throw new Error(
            "Live competition session not found."
        );
    }

    // -----------------------------------
    // Remove from Prepare only if this
    // athlete actually became the
    // current platform athlete.
    // -----------------------------------

    if (
        session.currentEntryId &&
        session.currentEntryId
            .toString() ===
        competitionEntry._id
            .toString()
    ) {

        session.prepareEntryId =
            null;

        await session.save();

        console.log(
            "Athlete moved from Prepare to Platform."
        );

    } else {

        console.log(
            "Platform occupied."
        );

        console.log(
            "Athlete remains available for next turn."
        );

    }

    // -----------------------------------
    // Return updated entry
    // -----------------------------------

    return await CompetitionEntry.findById(
        entryId
    );
};

export default saveDeclaration;