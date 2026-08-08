import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";

const updateCurrentPlatformAthlete = async (
    competitionId,
    gender,
    preferredEntryId = null
) => {

    gender =
        gender.toLowerCase();

    const session =
        await LiveCompetition.findOne({
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
        preferredEntryId?.toString() ??
            "NONE"
    );

    console.log(
        "Current Entry BEFORE:",
        session.currentEntryId
            ?.toString() ?? "NONE"
    );

    console.log(
        "Prepare Entry BEFORE:",
        session.prepareEntryId
            ?.toString() ?? "NONE"
    );

    console.log(
        "Current Phase:",
        session.currentPhase
    );

    // -----------------------------------
    // Platform already occupied
    //
    // NEVER replace the athlete currently
    // on the platform.
    // -----------------------------------

    if (session.currentEntryId) {

        console.log(
            "PLATFORM ALREADY OCCUPIED."
        );

        console.log(
            "Current Entry:",
            session.currentEntryId
                .toString()
        );

        return session;
    }

    // -----------------------------------
    // We only allow an explicitly declared
    // athlete to become current.
    //
    // No preferredEntryId means:
    // DO NOT automatically select anyone.
    // -----------------------------------

    if (!preferredEntryId) {

        console.log(
            "NO EXPLICIT DECLARATION."
        );

        console.log(
            "PLATFORM REMAINS EMPTY."
        );

        return session;
    }

    // -----------------------------------
    // Load competition entries
    // -----------------------------------

    const entries =
        await buildWorkingSheetData(
            competitionId,
            gender,
            true,
            session.selectedWeightCategories
        );

    console.log(
        "Total Entries:",
        entries.length
    );

    // -----------------------------------
    // Find the EXACT declared athlete
    // -----------------------------------

    const preferredEntry =
        entries.find(
            (entry) =>
                entry.entryId.toString() ===
                preferredEntryId.toString()
        );

    if (!preferredEntry) {

        throw new Error(
            "Declared athlete is not part of this live competition."
        );
    }

    // -----------------------------------
    // Get current attempt
    // -----------------------------------

    const currentAttempt =
        getCurrentAttempt(
            preferredEntry.competitionEntry
        );

    console.log(
        "===== DECLARED ATHLETE CHECK ====="
    );

    console.log(
        "Entry:",
        preferredEntry.entryId
            .toString()
    );

    console.log(
        "Name:",
        preferredEntry.name
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
        currentAttempt.declaredWeight
    );

    console.log(
        "Result:",
        currentAttempt.result
    );

    // -----------------------------------
    // Validate current attempt
    // -----------------------------------

    if (
        currentAttempt.completed
    ) {

        throw new Error(
            "Declared athlete has completed the competition."
        );
    }

    if (
        currentAttempt.phase !==
        session.currentPhase
    ) {

        throw new Error(
            `Phase mismatch. Competition is in ${session.currentPhase}, but declared athlete is in ${currentAttempt.phase}.`
        );
    }

    // -----------------------------------
    // Explicit declaration is required
    // -----------------------------------

    if (
        currentAttempt.declaredWeight ==
            null ||
        currentAttempt.declaredWeight <= 0
    ) {

        throw new Error(
            "Athlete has not declared a valid weight."
        );
    }

    // -----------------------------------
    // Put EXACT declared athlete
    // on the platform.
    //
    // Do NOT call selectNextAthlete().
    // The official declaration is
    // authoritative.
    // -----------------------------------

    session.currentEntryId =
        preferredEntry.entryId;

    // -----------------------------------
    // If this athlete was the one waiting
    // in Prepare, remove them from Prepare.
    // -----------------------------------

    if (
        session.prepareEntryId &&
        session.prepareEntryId
            .toString() ===
            preferredEntry.entryId
                .toString()
    ) {

        session.prepareEntryId =
            null;
    }

    await session.save();

    console.log(
        "===== ATHLETE MOVED TO PLATFORM ====="
    );

    console.log(
        "Current Entry AFTER:",
        session.currentEntryId
            ?.toString() ?? "NONE"
    );

    console.log(
        "Prepare Entry AFTER:",
        session.prepareEntryId
            ?.toString() ?? "NONE"
    );

    console.log(
        "Declared Weight:",
        currentAttempt.declaredWeight
    );

    return session;
};

export default updateCurrentPlatformAthlete;