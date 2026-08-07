import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";
import selectNextAthlete from "./selectNextAthlete.js";

const updateCurrentPlatformAthlete = async (
    competitionId,
    gender
) => {

    gender = gender.toLowerCase();

    const session = await LiveCompetition.findOne({
        competitionId,
        gender,
    });

    if (!session) {
        throw new Error(
            "Live competition session not found."
        );
    }

    // ---------------------------------
    // Platform already occupied
    // Do NOT replace current athlete
    // ---------------------------------
    if (session.currentEntryId) {
        return session;
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
            attempt.phase === session.currentPhase &&
            attempt.declaredWeight != null
        );

    });

    // ---------------------------------
    // Nobody ready
    // ---------------------------------
    if (!eligibleEntries.length) {

        console.log(
            "No athletes are ready for the platform."
        );

        session.currentEntryId = null;

        await session.save();

        return session;

    }

    const nextAthlete =
        selectNextAthlete(
            eligibleEntries,
            null
        );

    if (!nextAthlete) {

        session.currentEntryId = null;

        await session.save();

        return session;

    }

    session.currentEntryId =
        nextAthlete.entryId;

    await session.save();

    return session;

};

export default updateCurrentPlatformAthlete;