import processLift
    from "../services/liveCompetition/processLift.js";

import saveDeclaration
    from "../services/liveCompetition/saveDeclaration.js";

import startLiveCompetition
    from "../services/liveCompetition/startLiveCompetition.js";

import getLiveCompetition
    from "../services/liveCompetition/getLiveCompetition.js";

import selectOfficialAthlete
    from "../services/liveCompetition/selectOfficialAthlete.js";

import getQueueState
    from "../services/liveCompetition/getQueueState.js";

import correctCompletedAttemptWeight
    from "../services/liveCompetition/correctCompletedAttemptWeight.js";

import correctCompletedAttemptResult
    from "../services/liveCompetition/createCompletedAttemptResult.js";

    import generateFinalResultService
    from "../services/pdf/finalResult/generateFinalResultService.js";

// =====================================
// GET LIVE COMPETITION
// =====================================

export const getLiveCompetitionController = async (
    req,
    res
) => {

    try {

        const {
            competitionId,
            gender,
        } = req.params;


        console.log("===== GET LIVE COMPETITION =====");

        console.log(
            "competitionId:",
            competitionId
        );

        console.log(
            "gender:",
            gender
        );


        const result =
            await getLiveCompetition(
                competitionId,
                gender
            );


        return res.status(200).json({

            success: true,

            data: result,

        });

    } catch (error) {

        console.error(
            "===== GET LIVE COMPETITION ERROR ====="
        );

        console.error(
            "Message:",
            error?.message
        );

        console.error(
            "Stack:",
            error?.stack
        );


        return res.status(
            error?.statusCode || 400
        ).json({

            success: false,

            code:
                error?.code || null,

            message:
                error?.message ||
                "Failed to load live competition.",

        });

    }

};
// =====================================
// GENERATE FINAL RESULT PDF
//
// IMPORTANT:
//
// PDF generation is allowed only after
// the live competition has reached
// COMPLETED.
//
// The PDF uses the existing authoritative
// CompetitionEntry result state.
//
// This controller does not calculate:
// - best Snatch
// - best Clean & Jerk
// - Total
// - Rank
//
// Those values already belong to the
// existing competition result flow.
//
// ageCategory:
// - U17
// - U19
//
// The selected age category is passed to
// the final-result service, where the
// authoritative result rows are filtered.
// =====================================

export const generateFinalResultPdfController =
    async (
        req,
        res
    ) => {

        try {

            const {
                competitionId,
                gender,
            } = req.params;


            const {
                ageCategory,
            } = req.query;


            console.log(
                "===== GENERATE FINAL RESULT PDF ====="
            );

            console.log(
                "competitionId:",
                competitionId
            );

            console.log(
                "gender:",
                gender
            );

            console.log(
                "ageCategory:",
                ageCategory
            );


            // =====================================
            // VALIDATION
            // =====================================

            if (!competitionId) {

                return res.status(400).json({

                    success: false,

                    code:
                        "INVALID_COMPETITION_ID",

                    message:
                        "Competition ID is required.",

                });

            }


            if (!gender) {

                return res.status(400).json({

                    success: false,

                    code:
                        "INVALID_GENDER",

                    message:
                        "Gender is required.",

                });

            }


            // =====================================
            // AGE CATEGORY VALIDATION
            //
            // Only the two final-result
            // categories currently supported
            // by the Officials Screen are
            // accepted.
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

                return res.status(400).json({

                    success: false,

                    code:
                        "INVALID_AGE_CATEGORY",

                    message:
                        "Age category must be U17 or U19.",

                });

            }


            // =====================================
            // GENERATE PDF
            // =====================================

            const pdf =
                await generateFinalResultService(

                    competitionId,

                    gender,

                    normalizedAgeCategory

                );


            // =====================================
            // PDF RESPONSE
            // =====================================

            const safeGender =
                String(gender)
                    .trim()
                    .toLowerCase();


            const safeAgeCategory =
                normalizedAgeCategory
                    .toLowerCase();


            res.set({

                "Content-Type":
                    "application/pdf",

                "Content-Disposition":
                    `attachment; filename="final-result-${safeGender}-${safeAgeCategory}.pdf"`,

                "Content-Length":
                    pdf.length,

            });


            return res.status(200).send(
                pdf
            );

        } catch (error) {

            console.error(
                "===== GENERATE FINAL RESULT PDF ERROR ====="
            );

            console.error(
                "Message:",
                error?.message
            );

            console.error(
                "Code:",
                error?.code
            );

            console.error(
                "Stack:",
                error?.stack
            );


            return res.status(
                error?.statusCode || 400
            ).json({

                success: false,

                code:
                    error?.code || null,

                message:
                    error?.message ||
                    "Failed to generate final result PDF.",

            });

        }

    };
// =====================================
// CORRECT COMPLETED ATTEMPT RESULT
//
// FEATURE 2
//
// Corrects GOOD <-> NO_LIFT on an
// already completed attempt.
// =====================================

export const correctCompletedAttemptResultController =
    async (
        req,
        res
    ) => {

        try {

            const {
                entryId,
                competitionId,
                gender,
                phase,
                attemptNo,
                correctedResult,
                expectedStateVersion,
            } = req.body;


            // =====================================
            // STATE VERSION VALIDATION
            // =====================================

            if (
                !Number.isInteger(
                    expectedStateVersion
                ) ||
                expectedStateVersion < 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "expectedStateVersion must be a non-negative integer.",

                });

            }


            const result =
                await correctCompletedAttemptResult({

                    entryId,

                    competitionId,

                    gender,

                    phase,

                    attemptNo,

                    correctedResult,

                    expectedStateVersion,

                });


            return res.status(200).json({

                success: true,

                message:
                    "Completed attempt result corrected successfully.",

                data:
                    result,

            });

        } catch (error) {

            console.error(
                "Failed to correct completed attempt result:",
                error
            );


if (
    error?.code === "STALE_STATE" ||
    error?.statusCode === 409
) {

    return res.status(409).json({

        success: false,

        code:
            error?.code || "STALE_STATE",

        message:
            error?.message,

        expectedStateVersion:
            error?.expectedStateVersion,

        currentStateVersion:
            error?.currentStateVersion,

    });

}

            return res.status(
                error?.statusCode || 400
            ).json({

                success: false,

                code:
                    error?.code || null,

                message:
                    error?.message ||
                    "Failed to correct completed attempt result.",

            });

        }

    };


// =====================================
// CORRECT COMPLETED ATTEMPT WEIGHT
//
// FEATURE 1
//
// Corrects the recorded weight of an
// already completed attempt.
//
// This does NOT change the result.
// =====================================

export const correctCompletedAttemptWeightController =
    async (req, res) => {

        try {

            const result =
                await correctCompletedAttemptWeight(
                    req.body
                );

            return res.status(200).json({

                success: true,

                message:
                    "Completed attempt weight corrected successfully.",

                data: result,

            });

        } catch (error) {

            console.error(
                "Failed to correct completed attempt weight:",
                error
            );

            return res.status(
                error.statusCode || 400
            ).json({

                success: false,

                code:
                    error.code || null,

                message:
                    error.message ||
                    "Failed to correct completed attempt weight.",

            });

        }

    };


// =====================================
// START LIVE COMPETITION
// =====================================

export const startLiveCompetitionController =
    async (
        req,
        res
    ) => {

        try {

            console.log(
                "===== START LIVE COMPETITION REQUEST ====="
            );


            const competitionId =
                req.params?.competitionId ??
                req.body?.competitionId;


            const gender =
                req.params?.gender ??
                req.body?.gender;


            console.log(
                "Resolved competitionId:",
                competitionId
            );

            console.log(
                "Resolved gender:",
                gender
            );


            // =====================================
            // VALIDATION
            // =====================================

            if (!competitionId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Competition ID is required.",

                });

            }


            if (!gender) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Gender is required.",

                });

            }


            const {
                sessionName = "",
                selectedWeightCategories = [],
            } = req.body ?? {};


            // =====================================
            // START SERVICE
            // =====================================

            const result =
                await startLiveCompetition({

                    competitionId,

                    gender,

                    sessionName,

                    selectedWeightCategories,

                });


            return res.status(200).json({

                success: true,

                message:
                    "Live competition started successfully.",

                data:
                    result,

            });

        } catch (error) {

            console.error(
                "===== START LIVE COMPETITION ERROR ====="
            );

            console.error(
                "Message:",
                error?.message
            );

            console.error(
                "Stack:",
                error?.stack
            );


            return res.status(
                error?.statusCode || 400
            ).json({

                success: false,

                code:
                    error?.code || null,

                message:
                    error?.message ||
                    "Failed to start live competition.",

            });

        }

    };


// =====================================
// SELECT OFFICIAL ATHLETE
//
// LEGACY / COMPATIBILITY ENDPOINT
//
// Automatic queue is the target behavior.
// This endpoint is retained so unrelated
// existing functionality does not break.
// =====================================

export const selectOfficialAthleteController =
    async (
        req,
        res
    ) => {

        try {

            const {
                competitionId,
                gender,
                entryId,
                expectedStateVersion,
            } = req.body;


            const result =
                await selectOfficialAthlete({

                    competitionId,

                    gender,

                    entryId,

                    expectedStateVersion,

                });


            return res.status(200).json({

                success: true,

                message:
                    "Athlete selected successfully.",

                data:
                    result,

            });

        } catch (error) {

            if (
                error?.code === "STALE_STATE" ||
                error?.statusCode === 409
            ) {

                return res.status(409).json({

                    success: false,

                    code:
                        "STALE_STATE",

                    message:
                        error.message,

                    expectedStateVersion:
                        error.expectedStateVersion,

                    currentStateVersion:
                        error.currentStateVersion,

                });

            }


            return res.status(
                error?.statusCode || 400
            ).json({

                success: false,

                code:
                    error?.code || null,

                message:
                    error?.message,

            });

        }

    };


// =====================================
// PROCESS LIFT
//
// GOOD LIFT / NO LIFT
// =====================================

export const processLiftController =
    async (
        req,
        res
    ) => {

        try {

            const {
                entryId,
                competitionId,
                gender,
                result,
                expectedStateVersion,
            } = req.body;


            // =====================================
            // STATE VERSION VALIDATION
            // =====================================

            if (
                !Number.isInteger(
                    expectedStateVersion
                ) ||
                expectedStateVersion < 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "expectedStateVersion must be a non-negative integer.",

                });

            }


            const data =
                await processLift({

                    entryId,

                    competitionId,

                    gender,

                    result,

                    expectedStateVersion,

                });


            return res.status(200).json({

                success: true,

                message:
                    "Lift processed successfully.",

                data,

            });

        } catch (error) {

            if (
                error?.code === "STALE_STATE" ||
                error?.statusCode === 409
            ) {

                return res.status(409).json({

                    success: false,

                    code:
                        "STALE_STATE",

                    message:
                        error.message,

                    expectedStateVersion:
                        error.expectedStateVersion,

                    currentStateVersion:
                        error.currentStateVersion,

                });

            }


            return res.status(
                error?.statusCode || 400
            ).json({

                success: false,

                code:
                    error?.code || null,

                message:
                    error?.message,

            });

        }

    };


// =====================================
// SAVE DECLARED WEIGHT
// =====================================

export const saveDeclaredWeightController =
    async (
        req,
        res
    ) => {

        try {

            const result =
                await saveDeclaration(
                    req.body
                );


            return res.status(200).json({

                success: true,

                message:
                    "Declared weight updated successfully.",

                data:
                    result,

            });

        } catch (error) {

            if (
                error?.code === "STALE_STATE" ||
                error?.statusCode === 409
            ) {

                return res.status(409).json({

                    success: false,

                    code:
                        "STALE_STATE",

                    message:
                        error.message,

                    expectedStateVersion:
                        error.expectedStateVersion,

                    currentStateVersion:
                        error.currentStateVersion,

                });

            }


            return res.status(
                error?.statusCode || 400
            ).json({

                success: false,

                code:
                    error?.code || null,

                message:
                    error?.message,

            });

        }

    };


// =====================================
// GET AUTHORITATIVE QUEUE STATE
//
// Feature 3.4
//
// READ ONLY.
//
// Returns:
//
// - current
// - next
// - upcoming
// - queue
// - phase
// - stateVersion
//
// This controller MUST NOT select or
// move an athlete.
// =====================================

export const getQueueStateController = async (
    req,
    res
) => {

    try {

        const {
            competitionId,
            gender,
        } = req.params;

        console.log("===== QUEUE CONTROLLER =====");

        console.log(
            "req.params:",
            req.params
        );

        console.log(
            "Resolved competitionId:",
            competitionId
        );

        console.log(
            "Resolved gender:",
            gender
        );

        // IMPORTANT:
        // getQueueState expects an object.
        const result =
            await getQueueState({
                competitionId,
                gender,
            });

        console.log(
            "===== QUEUE RESULT ====="
        );

        console.log({

            competitionId:
                result?.competitionId,

            gender:
                result?.gender,

            currentPhase:
                result?.currentPhase,

            current:
                result?.current?.name ?? null,

            next:
                result?.next?.name ?? null,

            upcoming:
                result?.upcoming?.length ?? 0,

            queueCount:
                result?.queueCount ?? 0,

        });

        return res.status(200).json({

            success: true,

            data: result,

        });

    } catch (error) {

        console.error(
            "===== QUEUE CONTROLLER ERROR ====="
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Code:",
            error.code
        );

        console.error(
            "Stack:",
            error.stack
        );

        return res.status(
            error.statusCode || 400
        ).json({

            success: false,

            code:
                error.code ?? null,

            message:
                error.message,

        });

    }

};