import Competition
    from "../../../models/Competition.js";

import LiveCompetition
    from "../../../models/LiveCompetition.js";

import buildWorkingSheetData
    from "../workingSheet/buildWorkingSheetData.js";

import generateFinalResult
    from "./generateFinalResult.js";

import {
    getSnatchBombOutState,
} from "../../liveCompetition/getLiveCompetition.js";


export const generateFinalResultService = async (
    competitionId,
    gender,
    ageCategory
) => {

    // =====================================
    // VALIDATION
    // =====================================

    if (!competitionId) {

        const error =
            new Error(
                "Competition ID is required."
            );

        error.code =
            "INVALID_COMPETITION_ID";

        error.statusCode =
            400;

        throw error;

    }


    if (!gender) {

        const error =
            new Error(
                "Gender is required."
            );

        error.code =
            "INVALID_GENDER";

        error.statusCode =
            400;

        throw error;

    }


    const normalizedGender =
        String(gender)
            .trim()
            .toLowerCase();


    if (
        normalizedGender !== "male" &&
        normalizedGender !== "female"
    ) {

        const error =
            new Error(
                "Gender must be male or female."
            );

        error.code =
            "INVALID_GENDER";

        error.statusCode =
            400;

        throw error;

    }


    // =====================================
    // AGE CATEGORY
    // =====================================

    const normalizedAgeCategory =
        String(
            ageCategory ?? ""
        )
            .trim()
            .toUpperCase();


    if (
        normalizedAgeCategory !== "U17" &&
        normalizedAgeCategory !== "U19"
    ) {

        const error =
            new Error(
                "Age category must be U17 or U19."
            );

        error.code =
            "INVALID_AGE_CATEGORY";

        error.statusCode =
            400;

        throw error;

    }


    // =====================================
    // LOAD COMPETITION
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
    // LOAD LIVE SESSION
    // =====================================

    const liveCompetition =
        await LiveCompetition.findOne({

            competitionId,

            gender:
                normalizedGender,

        });


    if (!liveCompetition) {

        const error =
            new Error(
                "Live competition session not found."
            );

        error.code =
            "LIVE_SESSION_NOT_FOUND";

        error.statusCode =
            404;

        throw error;

    }


    // =====================================
    // COMPETITION MUST BE COMPLETED
    // =====================================

    if (
        liveCompetition.currentPhase !==
        "COMPLETED"
    ) {

        const error =
            new Error(
                "Final result PDF is available only after the competition is completed."
            );

        error.code =
            "COMPETITION_NOT_COMPLETED";

        error.statusCode =
            409;

        throw error;

    }


    // =====================================
    // RECOVERY SAFETY
    // =====================================

    if (
        liveCompetition.status ===
        "RECOVERY_REQUIRED"
    ) {

        const error =
            new Error(
                "Live competition requires recovery."
            );

        error.code =
            "RECOVERY_REQUIRED";

        error.statusCode =
            409;

        throw error;

    }


    if (
        liveCompetition.integrity?.status ===
        "RECOVERY_REQUIRED"
    ) {

        const error =
            new Error(
                "Live competition integrity requires recovery."
            );

        error.code =
            "QUEUE_INTEGRITY_ERROR";

        error.statusCode =
            409;

        throw error;

    }


    // =====================================
    // LOAD FINAL RESULT DATA
    //
    // IMPORTANT:
    //
    // Use the exact session category scope.
    //
    // Do NOT use [] because that could expose
    // entries outside the completed session.
    //
    // Do NOT calculate ranking here.
    // =====================================

    const resultRows =
        await buildWorkingSheetData(

            competitionId,

            normalizedGender,

            true,

            liveCompetition
                .selectedWeightCategories ||
            [],

            null,

            null

        );


    if (
        !Array.isArray(
            resultRows
        )
    ) {

        const error =
            new Error(
                "Unable to prepare final result data."
            );

        error.code =
            "FINAL_RESULT_DATA_ERROR";

        error.statusCode =
            500;

        throw error;

    }


    // =====================================
    // APPLY AUTHORITATIVE PRESENTATION STATE
    //
    // Reuse the SAME bomb-out calculation
    // used by getLiveCompetition().
    //
    // This does NOT calculate queue order.
    // =====================================

    const finalResultRows =
        resultRows.map(
            (entry) => {

                const bombOutState =
                    getSnatchBombOutState(
                        entry,
                        competition
                            .competitionFormat
                    );


                return {

                    ...entry,

                    eliminated:
                        bombOutState
                            .eliminated,

                    eliminationReason:
                        bombOutState
                            .eliminationReason,

                };

            }
        );


    // =====================================
    // FILTER BY AGE CATEGORY
    //
    // IMPORTANT:
    //
    // Filtering happens AFTER the
    // authoritative result data and
    // elimination state have been prepared.
    //
    // This does NOT recalculate:
    // - best Snatch
    // - best Clean & Jerk
    // - Total
    // - Place
    // - ranking
    //
    // It only limits which completed
    // athletes are included in the
    // requested final-result PDF.
    // =====================================

    const filteredResultRows =
        finalResultRows.filter(
            (entry) => {

                const entryAgeCategory =
                    String(
                        entry.ageCategory ?? ""
                    )
                        .trim()
                        .toUpperCase();


                return (
                    entryAgeCategory ===
                    normalizedAgeCategory
                );

            }
        );


    // =====================================
    // EMPTY CATEGORY PROTECTION
    // =====================================

    if (
        filteredResultRows.length === 0
    ) {

        const error =
            new Error(
                `No athletes found for age category ${normalizedAgeCategory}.`
            );

        error.code =
            "NO_ATHLETES_FOR_AGE_CATEGORY";

        error.statusCode =
            404;

        throw error;

    }


    // =====================================
    // GENERATE PDF
    // =====================================

    const pdf =
        await generateFinalResult(

            competition,

            filteredResultRows,

            normalizedGender,

            normalizedAgeCategory

        );


    return pdf;

};


export default generateFinalResultService;