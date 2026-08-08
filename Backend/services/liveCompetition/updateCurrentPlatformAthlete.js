import LiveCompetition from "../../models/LiveCompetition.js";
import buildWorkingSheetData from "../pdf/workingSheet/buildWorkingSheetData.js";
import getCurrentAttempt from "./getCurrentAttempt.js";
import selectNextAthlete from "./selectNextAthlete.js";

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
    // Find currently declared athletes
    //
    // IMPORTANT:
    //
    // Attempt 1 with only opening weight
    // is NOT considered declared.
    //
    // It becomes eligible only after the
    // official saves the declaration.
    //
    // Attempt 2 / 3 also require
    // declaredWeight.
    // -----------------------------------

    const declaredEntries =
        entries.filter(
            (entry) => {

                const attempt =
                    getCurrentAttempt(
                        entry.competitionEntry
                    );

                if (
                    attempt.completed
                ) {
                    return false;
                }

                if (
                    attempt.phase !==
                    session.currentPhase
                ) {
                    return false;
                }

                const isDeclared =
                    attempt.declaredWeight != null &&
                    attempt.declaredWeight > 0;

                if (isDeclared) {

                    console.log(
                        "DECLARED ATHLETE:",
                        {
                            name:
                                entry.name,

                            entryId:
                                entry.entryId
                                    .toString(),

                            phase:
                                attempt.phase,

                            attempt:
                                attempt.attemptNo,

                            declaredWeight:
                                attempt.declaredWeight,

                            declaredAt:
                                attempt.declaredAt,

                            lot:
                                entry.lotNumber,
                        }
                    );

                }

                return isDeclared;
            }
        );


    console.log(
        "TOTAL DECLARED ATHLETES:",
        declaredEntries.length
    );


    // -----------------------------------
    // Nobody has declared
    // -----------------------------------

    if (
        !declaredEntries.length
    ) {

        console.log(
            "NO DECLARED ATHLETE."
        );

        console.log(
            "PLATFORM REMAINS EMPTY."
        );

        return session;
    }


    // -----------------------------------
    // Check preferred declaration
    //
    // The preferred athlete is the athlete
    // whose declaration triggered this
    // function.
    //
    // BUT:
    //
    // preferredEntryId does NOT automatically
    // give that athlete platform priority.
    //
    // They must compete against all other
    // declared athletes according to the
    // calling-order rules.
    // -----------------------------------

    if (preferredEntryId) {

        const preferredEntry =
            declaredEntries.find(
                (entry) =>
                    entry.entryId
                        .toString() ===
                    preferredEntryId
                        .toString()
            );

        if (preferredEntry) {

            const preferredAttempt =
                getCurrentAttempt(
                    preferredEntry
                        .competitionEntry
                );

            console.log(
                "===== PREFERRED DECLARATION ====="
            );

            console.log(
                "Name:",
                preferredEntry.name
            );

            console.log(
                "Entry:",
                preferredEntry.entryId
                    .toString()
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
                "PREFERRED ENTRY NOT IN DECLARED LIST."
            );
        }
    }


    // -----------------------------------
    // Select according to competition
    // calling order
    //
    // selectNextAthlete() now decides:
    //
    // 1. Lowest weight
    // 2. Lowest attempt number
    // 3. Previous attempt sequence
    // 4. Lowest lot number
    // -----------------------------------

    const nextAthlete =
        selectNextAthlete(
            declaredEntries
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
        "===== PLATFORM ATHLETE SELECTED ====="
    );

    console.log(
        "Entry:",
        nextAthlete.entryId
            .toString()
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

    console.log(
        "Declared At:",
        selectedAttempt.declaredAt
    );

    console.log(
        "Lot:",
        nextAthlete.lotNumber
    );


    // -----------------------------------
    // Put selected athlete on platform
    // -----------------------------------

    session.currentEntryId =
        nextAthlete.entryId;


    // -----------------------------------
    // Remove selected athlete from
    // Prepare if applicable
    // -----------------------------------

    if (
        session.prepareEntryId &&
        session.prepareEntryId
            .toString() ===
        nextAthlete.entryId
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


    return session;
};

export default updateCurrentPlatformAthlete;