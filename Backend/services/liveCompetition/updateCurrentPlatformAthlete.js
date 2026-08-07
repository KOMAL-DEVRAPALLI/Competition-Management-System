import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";
import selectNextAthlete from "./selectNextAthlete.js";

const updateCurrentPlatformAthlete = async (
    competitionId,
    gender
) => {

    const session = await LiveCompetition.findOne({
        competitionId,
        gender,
    });

    if (!session) {
        throw new Error("Live competition session not found.");
    }

    const entries = await buildWorkingSheetData(
        competitionId,
        gender,
        true
    );

    const eligibleEntries = entries.filter((entry) => {

        const attempt = getCurrentAttempt(
            entry.competitionEntry
        );

        return (
            !attempt.completed &&
            attempt.phase === session.currentPhase
        );

    });

    if (!eligibleEntries.length) {
        return session;
    }

    const currentAthlete =
        selectNextAthlete(
            eligibleEntries,
            null
        );

    if (!currentAthlete) {
        return session;
    }

    session.currentEntryId =
        currentAthlete.entryId;

    await session.save();

    return session;

};

export default updateCurrentPlatformAthlete;