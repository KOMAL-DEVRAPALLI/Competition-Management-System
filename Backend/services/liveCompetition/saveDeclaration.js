import CompetitionEntry from "../../models/CompetitionEntry.js";
import getCurrentAttempt from "./getCurrentAttempt.js";
import updateCurrentPlatformAthlete from "./updateCurrentPlatformAthlete.js";

const saveDeclaration = async ({
    entryId,
    declaredWeight,
}) => {

    if (declaredWeight == null || declaredWeight <= 0) {
        throw new Error("Invalid declared weight.");
    }

    const competitionEntry = await CompetitionEntry.findById(entryId);

    if (!competitionEntry) {
        throw new Error("Competition entry not found.");
    }

    const currentAttempt = getCurrentAttempt(competitionEntry);

    if (currentAttempt.completed) {
        throw new Error("Athlete has completed the competition.");
    }

    const attempts =
        currentAttempt.phase === "SNATCH"
            ? competitionEntry.snatchAttempts
            : competitionEntry.cleanJerkAttempts;

    const attempt = attempts.find(
        (item) =>
            item.attemptNo === currentAttempt.attemptNo
    );

    if (!attempt) {
        throw new Error("Attempt not found.");
    }

    attempt.declaredWeight = declaredWeight;
    attempt.declaredAt = new Date();

    await competitionEntry.save();

    await competitionEntry.populate("athleteId");

    await updateCurrentPlatformAthlete(
        competitionEntry.competitionId,
        competitionEntry.athleteId.personalInfo.gender
    );

    return await CompetitionEntry.findById(entryId);

};

export default saveDeclaration;