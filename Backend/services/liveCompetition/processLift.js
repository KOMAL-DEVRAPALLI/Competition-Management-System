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

    const competitionEntry =
        await CompetitionEntry.findById(entryId);

    if (!competitionEntry) {
        throw new Error(
            "Competition entry not found."
        );
    }

    const currentAttempt =
        getCurrentAttempt(competitionEntry);

    if (currentAttempt.completed) {
        throw new Error(
            "Athlete has already completed the competition."
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
        throw new Error("Attempt not found.");
    }

    attempt.result = result;

    await competitionEntry.save();

    await updateCompetitionResults(entryId);

    await advanceCompetition(
        competitionId,
        gender
    );

    return await CompetitionEntry.findById(
        entryId
    );

};

export default processLift;