import CompetitionEntry from "../../models/CompetitionEntry.js";
import LiveCompetition from "../../models/LiveCompetition.js";
import getCurrentAttempt from "./getCurrentAttempt.js";
import updateCurrentPlatformAthlete from "./updateCurrentPlatformAthlete.js";

const saveDeclaration = async ({
    entryId,
    declaredWeight,
}) => {

    if (
        declaredWeight == null ||
        declaredWeight <= 0
    ) {
        throw new Error(
            "Invalid declared weight."
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

    const currentAttempt =
        getCurrentAttempt(
            competitionEntry
        );

    if (currentAttempt.completed) {
        throw new Error(
            "Athlete has completed the competition."
        );
    }

    const attempts =
        currentAttempt.phase === "SNATCH"
            ? competitionEntry.snatchAttempts
            : competitionEntry.cleanJerkAttempts;

    const attempt = attempts.find(
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
    // -----------------------------------

    attempt.declaredWeight =
        declaredWeight;

    attempt.declaredAt =
        new Date();

    await competitionEntry.save();

    await competitionEntry.populate(
        "athleteId"
    );

    const gender =
        competitionEntry.athleteId
            ?.personalInfo
            ?.gender;

    if (!gender) {
        throw new Error(
            "Athlete gender is missing."
        );
    }

    const normalizedGender =
        gender.toLowerCase();

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
        declaredWeight
    );

    // -----------------------------------
    // Try to put a ready athlete on the
    // platform.
    //
    // If the platform is occupied,
    // updateCurrentPlatformAthlete()
    // will leave the current athlete
    // unchanged.
    // -----------------------------------

    await updateCurrentPlatformAthlete(
        competitionEntry.competitionId,
        normalizedGender,
        competitionEntry._id
    );

    // -----------------------------------
    // Check the actual platform state
    // after attempting to update it.
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
    // Only remove this athlete from
    // Prepare if this athlete actually
    // became the current platform athlete.
    // -----------------------------------

    if (
        session.currentEntryId &&
        session.currentEntryId
            .toString() ===
            competitionEntry._id
                .toString()
    ) {

        session.prepareEntryId = null;

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

    return await CompetitionEntry.findById(
        entryId
    );
};

export default saveDeclaration;