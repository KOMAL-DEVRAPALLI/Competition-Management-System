import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";
import selectNextAthlete from "./selectNextAthlete.js";

const advanceCompetition = async (
    competitionId,
    gender
) => {

    const session = await LiveCompetition.findOne({
        competitionId,
        gender,
    });

    if (!session) {
        throw new Error(
            "Live competition session not found."
        );
    }

    const entries = await buildWorkingSheetData(
        competitionId,
        gender,
        true
    );

    if (!entries.length) {
        throw new Error("No athletes found.");
    }

    const getEligibleEntries = (phase) => {

        return entries.filter((entry) => {

            const attempt = getCurrentAttempt(
                entry.competitionEntry
            );

            return (
                !attempt.completed &&
                attempt.phase === phase
            );

        });

    };

    // Current phase athletes
    let eligibleEntries = getEligibleEntries(
        session.currentPhase
    );

    // Move to Clean & Jerk if Snatch is finished
    if (!eligibleEntries.length) {

        if (session.currentPhase === "SNATCH") {

            session.currentPhase = "CLEAN_JERK";

            eligibleEntries = getEligibleEntries(
                "CLEAN_JERK"
            );

        } else {

            session.status = "FINISHED";

            await session.save();

            return session;

        }

    }

    if (!eligibleEntries.length) {
        throw new Error(
            "No eligible athletes found."
        );
    }

    const nextAthlete = selectNextAthlete(
        eligibleEntries,
        session.currentEntryId
    );

    if (!nextAthlete) {
        throw new Error(
            "Unable to determine next athlete."
        );
    }

    session.currentEntryId =
        nextAthlete.entryId;

    await session.save();

    return session;

};

export default advanceCompetition;