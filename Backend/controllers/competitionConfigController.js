import {
    getCompetitionConfig,
    saveCompetitionConfig,
} from "../services/competition/competitionConfigService.js";


// =====================================
// GET COMPETITION CONFIG
//
// GET
// /api/competition-config/:competitionId
// =====================================

export const getCompetitionConfigController =
    async (req, res) => {

        try {

            const {
                competitionId,
            } = req.params;

            const config =
                await getCompetitionConfig(
                    competitionId
                );

            return res.status(200).json({

                success: true,

                data: config,

            });

        } catch (error) {

            console.error(
                "Get competition config error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load competition configuration.",

            });

        }
    };


// =====================================
// SAVE COMPETITION CONFIG
//
// PATCH
// /api/competition-config/:competitionId
// =====================================

export const saveCompetitionConfigController =
    async (req, res) => {

        try {

            const {
                competitionId,
            } = req.params;

            const config =
                await saveCompetitionConfig(
                    competitionId,
                    req.body
                );

            return res.status(200).json({

                success: true,

                message:
                    "Competition configuration saved.",

                data: config,

            });

        } catch (error) {

            console.error(
                "Save competition config error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to save competition configuration.",

            });

        }
    };