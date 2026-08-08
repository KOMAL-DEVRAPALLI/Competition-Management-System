import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";
import selectNextAthlete from "./selectNextAthlete.js";

const updateCurrentPlatformAthlete = async (
    competitionId,
    gender,
    preferredEntryId = null
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

    console.log(
        "===== UPDATE CURRENT PLATFORM START ====="
    );

    console.log(
        "Competition:",
        competitionId.toString()
    );

    console.log(
        "Gender:",
        gender
    );

    console.log(
        "Preferred Entry:",
        preferredEntryId?.toString()
    );

    console.log(
        "Current Entry BEFORE:",
        session.currentEntryId?.toString()
    );

    console.log(
        "Prepare Entry BEFORE:",
        session.prepareEntryId?.toString()
    );

    console.log(
        "Current Phase:",
        session.currentPhase
    );

    // ---------------------------------
    // Platform already occupied
    // ---------------------------------

    if (session.currentEntryId) {

        console.log(
            "Platform already occupied."
        );

        console.log(
            "Current Entry:",
            session.currentEntryId.toString()
        );

        return session;
    }

    const entries = await buildWorkingSheetData(
        competitionId,
        gender,
        true,
        session.selectedWeightCategories
    );

    console.log(
        "Total Entries:",
        entries.length
    );

    // ---------------------------------
    // Find all athletes whose current
    // attempt is declared
    // ---------------------------------

    const eligibleEntries =
        entries.filter((entry) => {

            const attempt =
                getCurrentAttempt(
                    entry.competitionEntry
                );

            const eligible =
                !attempt.completed &&
                attempt.phase ===
                    session.currentPhase &&
                attempt.declaredWeight != null;

            if (eligible) {

                console.log(
                    "ELIGIBLE ATHLETE:",
                    entry.entryId.toString()
                );

                console.log(
                    "Name:",
                    entry.name
                );

                console.log(
                    "Phase:",
                    attempt.phase
                );

                console.log(
                    "Attempt:",
                    attempt.attemptNo
                );

                console.log(
                    "Declared Weight:",
                    attempt.declaredWeight
                );

                console.log(
                    "Declared At:",
                    attempt.declaredAt
                );

            }

            return eligible;

        });

    console.log(
        "Eligible Entries:",
        eligibleEntries.length
    );

    // ---------------------------------
    // Nobody ready
    // ---------------------------------

    if (!eligibleEntries.length) {

        console.log(
            "NO ATHLETE READY FOR PLATFORM."
        );

        session.currentEntryId = null;

        await session.save();

        return session;
    }

    // ---------------------------------
    // Verify preferred declared entry
    // ---------------------------------

    if (preferredEntryId) {

        const preferredEntry =
            eligibleEntries.find(
                (entry) =>
                    entry.entryId.toString() ===
                    preferredEntryId.toString()
            );

        if (preferredEntry) {

            console.log(
                "PREFERRED ENTRY IS ELIGIBLE:"
            );

            console.log(
                "Entry:",
                preferredEntry.entryId.toString()
            );

            console.log(
                "Name:",
                preferredEntry.name
            );

            const preferredAttempt =
                getCurrentAttempt(
                    preferredEntry.competitionEntry
                );

            console.log(
                "Attempt:",
                preferredAttempt.attemptNo
            );

            console.log(
                "Declared Weight:",
                preferredAttempt.declaredWeight
            );

        } else {

            console.log(
                "PREFERRED ENTRY IS NOT ELIGIBLE."
            );

        }

    }

    // ---------------------------------
    // Select according to competition
    // ordering
    // ---------------------------------

    const nextAthlete =
        selectNextAthlete(
            eligibleEntries
        );

    if (!nextAthlete) {

        throw new Error(
            "Unable to determine next athlete."
        );

    }

    const selectedAttempt =
        getCurrentAttempt(
            nextAthlete.competitionEntry
        );

    console.log(
        "===== SELECTED PLATFORM ATHLETE ====="
    );

    console.log(
        "Entry:",
        nextAthlete.entryId.toString()
    );

    console.log(
        "Name:",
        nextAthlete.name
    );

    console.log(
        "Phase:",
        selectedAttempt.phase
    );

    console.log(
        "Attempt:",
        selectedAttempt.attemptNo
    );

    console.log(
        "Declared Weight:",
        selectedAttempt.declaredWeight
    );

    // ---------------------------------
    // Put selected athlete on platform
    // ---------------------------------

    session.currentEntryId =
        nextAthlete.entryId;

    await session.save();

    console.log(
        "===== UPDATE CURRENT PLATFORM END ====="
    );

    console.log(
        "Current Entry AFTER:",
        session.currentEntryId?.toString()
    );

    console.log(
        "Prepare Entry AFTER:",
        session.prepareEntryId?.toString()
    );

    return session;
};

export default updateCurrentPlatformAthlete;