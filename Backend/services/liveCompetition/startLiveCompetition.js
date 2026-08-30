import mongoose from "mongoose";

import Competition from "../../models/Competition.js";
import LiveCompetition from "../../models/LiveCompetition.js";

import buildWorkingSheetData
    from "../pdf/workingSheet/buildWorkingSheetData.js";

import getCurrentAttempt
    from "./getCurrentAttempt.js";

import updateCurrentPlatformAthlete
    from "./updateCurrentPlatformAthlete.js";


// =====================================
// START LIVE COMPETITION
//
// Responsibility:
//
// 1. Validate competition scope.
// 2. Validate competition format.
// 3. Load eligible competition entries.
// 4. Validate initial attempt state.
// 5. Create a fresh authoritative session.
// 6. Mark session RUNNING.
// 7. Resolve first athlete automatically
//    through Feature 3.5.
// 8. Return authoritative starting state.
//
// IMPORTANT:
//
// This service does NOT implement calling
// order itself.
//
// Feature 3.1 = eligibility
// Feature 3.2 = ordering
// Feature 3.3 = queue
// Feature 3.5 = platform assignment
//
// =====================================


const startLiveCompetition = async ({
    competitionId,
    gender,
    sessionName = "",
    selectedWeightCategories = [],
}) => {

    // =====================================
    // VALIDATE INPUT
    // =====================================

    if (!competitionId) {

        throw new Error(
            "Competition ID is required."
        );

    }

    if (!gender) {

        throw new Error(
            "Gender is required."
        );

    }


    // =====================================
    // VALIDATE COMPETITION ID
    // =====================================

    if (
        !mongoose.Types.ObjectId.isValid(
            competitionId
        )
    ) {

        const error =
            new Error(
                "Invalid competition ID."
            );

        error.code =
            "INVALID_COMPETITION_ID";

        error.statusCode =
            400;

        throw error;

    }


    const normalizedGender =
        String(gender)
            .trim()
            .toLowerCase();


    // =====================================
    // LOAD COMPETITION
    //
    // IMPORTANT:
    //
    // competitionFormat MUST already be
    // explicitly established before a live
    // competition session can become RUNNING.
    //
    // This validation happens BEFORE the
    // old LiveCompetition session is deleted.
    // =====================================

    const competition =
        await Competition.findById(
            competitionId
        );


    if (!competition) {

        const error =
            new Error(
                "Competition not found."
            );

        error.code =
            "COMPETITION_NOT_FOUND";

        error.statusCode =
            404;

        throw error;

    }


    // =====================================
    // COMPETITION FORMAT PREREQUISITE
    //
    // Valid formats are established through
    // the authoritative setCompetitionFormat
    // service.
    //
    // Do NOT automatically choose a format.
    // =====================================

    const competitionFormat =
        String(
            competition.competitionFormat ?? ""
        )
            .trim()
            .toUpperCase();


    if (
        !competitionFormat
    ) {

        const error =
            new Error(
                "Competition format must be explicitly established before starting live competition."
            );

        error.code =
            "COMPETITION_FORMAT_REQUIRED";

        error.statusCode =
            400;

        throw error;

    }


    // =====================================
    // NORMALIZE CATEGORIES
    // =====================================

    const normalizedSelectedCategories =
        Array.isArray(selectedWeightCategories)
            ? selectedWeightCategories
                .map((category) =>
                    String(category).trim()
                )
                .filter(Boolean)
            : [];


    if (
        normalizedSelectedCategories.length === 0
    ) {

        throw new Error(
            "At least one weight category must be selected."
        );

    }


    // =====================================
    // LOAD COMPETITION ENTRIES
    // =====================================

    let entries =
        await buildWorkingSheetData(
            competitionId,
            normalizedGender,
            true
        );


    if (!Array.isArray(entries)) {

        throw new Error(
            "Unable to load competition athletes."
        );

    }


    // =====================================
    // FILTER COMPETITION SCOPE
    // =====================================

    entries =
        entries.filter(
            (athlete) =>
                normalizedSelectedCategories.includes(
                    String(
                        athlete.weightCategory ?? ""
                    ).trim()
                )
        );


    if (!entries.length) {

        throw new Error(
            "No athletes found for the selected competition scope."
        );

    }


    // =====================================
    // VALIDATE INITIAL ATTEMPT STATE
    //
    // This is diagnostic/integrity validation.
    // Calling-order eligibility remains owned
    // by the queue engine.
    // =====================================

    for (const athlete of entries) {

        const attempt =
            getCurrentAttempt(
                athlete.competitionEntry,
                "SNATCH"
            );


        if (
            attempt?.integrityError
        ) {

            const error =
                new Error(
                    `Invalid Snatch state for ${athlete.name}: ${attempt.integrityError}`
                );

            error.code =
                "LIVE_START_INTEGRITY_ERROR";

            error.statusCode =
                409;

            throw error;

        }

    }


    // =====================================
    // REMOVE OLD SESSION
    //
    // This happens ONLY AFTER all mandatory
    // start prerequisites have passed.
    //
    // Therefore a missing competitionFormat
    // can never destroy an existing test/live
    // session before reporting the error.
    // =====================================

    await LiveCompetition.deleteMany({

        competitionId,

        gender:
            normalizedGender,

    });


    // =====================================
    // CREATE AUTHORITATIVE SESSION
    //
    // IMPORTANT:
    //
    // A successful "Start Competition"
    // action means the live session is now
    // RUNNING.
    //
    // currentEntryId starts empty because
    // Feature 3.5 assigns it immediately
    // from the authoritative queue.
    // =====================================

    const session =
        await LiveCompetition.create({

            competitionId,

            gender:
                normalizedGender,

            sessionName,

            selectedWeightCategories:
                normalizedSelectedCategories,

            currentEntryId:
                null,

            prepareEntryId:
                null,

            currentPhase:
                "SNATCH",

            status:
                "RUNNING",

            stateVersion:
                0,

            integrity: {

                status:
                    "VALID",

                reason:
                    "",

                detectedAt:
                    null,

            },

        });


    // =====================================
    // FIRST AUTOMATIC PLATFORM ASSIGNMENT
    //
    // Feature 3.5 owns the actual
    // authoritative selection.
    //
    // It will:
    //
    // 1. calculate queue
    // 2. take queue[0]
    // 3. assign currentEntryId
    // 4. increment stateVersion
    //
    // No React selection.
    // No duplicate ordering logic.
    // =====================================

    const platformResult =
        await updateCurrentPlatformAthlete(

            competitionId,

            normalizedGender

        );


    // =====================================
    // LOAD FINAL AUTHORITATIVE SESSION
    // =====================================

    const finalSession =
        platformResult.session ??
        await LiveCompetition.findOne({

            competitionId,

            gender:
                normalizedGender,

        });


    if (!finalSession) {

        throw new Error(
            "Live competition session could not be recovered after start."
        );

    }


    // =====================================
    // RESPONSE ATHLETE MAPPER
    // =====================================

    const mapAthlete =
        (athlete) => {

            const currentAttempt =
                getCurrentAttempt(
                    athlete.competitionEntry,
                    finalSession.currentPhase
                );


            return {

                entryId:
                    athlete.entryId,

                athleteId:
                    athlete.athleteId,

                name:
                    athlete.name,

                registrationNo:
                    athlete.registrationNo,

                lotNumber:
                    athlete.lotNumber,

                event:
                    athlete.isYouth
                        ? "Y"
                        : athlete.isJunior
                        ? "J"
                        : athlete.isSenior
                        ? "S"
                        : "",

                bodyWeight:
                    athlete.bodyWeight,

                weightCategory:
                    athlete.weightCategory,

                displayWeightCategory:
                    athlete.displayWeightCategory,

                openingSnatch:
                    athlete.openingSnatch,

                openingCleanJerk:
                    athlete.openingCleanJerk,

                bestSnatch:
                    athlete.bestSnatch,

                bestCleanJerk:
                    athlete.bestCleanJerk,

                total:
                    athlete.total,

                place:
                    athlete.place,

                status:
                    "AVAILABLE",

                currentAttempt,

                snatchAttempts:
                    athlete
                        .competitionEntry
                        .snatchAttempts,

                cleanJerkAttempts:
                    athlete
                        .competitionEntry
                        .cleanJerkAttempts,

                competitionEntry:
                    athlete.competitionEntry,

            };

        };


    const athleteList =
        entries.map(
            mapAthlete
        );


    // =====================================
    // FINAL RESULT
    // =====================================

    console.log(
        "===== LIVE COMPETITION STARTED ====="
    );

    console.log({

        competitionId:
            competitionId.toString(),

        gender:
            normalizedGender,

        competitionFormat,

        phase:
            finalSession.currentPhase,

        status:
            finalSession.status,

        currentEntryId:
            finalSession.currentEntryId
                ?.toString() ?? null,

        stateVersion:
            finalSession.stateVersion,

        assignmentReason:
            platformResult.reason,

        assigned:
            platformResult.assigned,

    });


    return {

        session:
            finalSession,

        currentAthlete:
            platformResult.athlete ??
            null,

        declarationQueue:
            [],

        athletes:
            athleteList,

        totalAthletes:
            entries.length,

    };

};


export default startLiveCompetition;