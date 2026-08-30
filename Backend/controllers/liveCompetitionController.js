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