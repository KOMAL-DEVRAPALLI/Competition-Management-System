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
        throw new Error("Live competition session not found.");
    }

    const entries = await buildWorkingSheetData(
        competitionId,
        gender,
        true
    );

    if (!entries.length) {
        throw new Error("No athletes found.");
    }

    // Athletes still lifting in current phase
    let eligibleEntries = entries.filter((entry) => {

    const attempt = getCurrentAttempt(
        entry.competitionEntry
    );

   return (
    !attempt.completed &&
    attempt.phase === session.currentPhase
);

});
    // Current phase completed
    if (eligibleEntries.length === 0) {

        if (session.currentPhase === "SNATCH") {

            session.currentPhase = "CLEAN_JERK";

           eligibleEntries = entries.filter((entry) => {

    const attempt = getCurrentAttempt(
        entry.competitionEntry
    );

  return (
    !attempt.completed &&
    attempt.phase === session.currentPhase
);

});

        } else {

            session.status = "FINISHED";

            await session.save();

            return session;

        }

    }

  if (!eligibleEntries.length) {
    throw new Error("No eligible athletes found.");
}

const nextAthlete =
    selectNextAthlete(
        eligibleEntries,
        session.currentEntryId
    );

if (!nextAthlete) {
    throw new Error(
        "Unable to determine next athlete."
    );
}

console.log(
    "Current Entry:",
    session.currentEntryId.toString()
);

console.log(
    "Next Athlete:",
    nextAthlete.name,
    nextAthlete.entryId.toString()
);

session.currentEntryId = nextAthlete.entryId;

console.log(
    "Assigned Entry:",
    session.currentEntryId.toString()
);

await session.save();

const updatedSession =
    await LiveCompetition.findById(session._id);

console.log(
    "Saved Entry:",
    updatedSession.currentEntryId.toString()
);

};

export default advanceCompetition;