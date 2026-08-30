import getCompetitionById
    from "../services/competition/getCompetitionById.js";

import setCompetitionFormat
    from "../services/competition/setCompetitionFormat.js";

import createCompetition
    from "../services/competition/createCompetition.js";
    // =====================================
// CREATE COMPETITION
//
// POST /competition
//
// Creates the competition itself.
//
// IMPORTANT:
// competitionFormat is NOT established
// here automatically.
//
// It remains null until explicitly set
// through the competition-format endpoint.
//
// This controller:
// - receives creation data
// - calls the creation service
// - returns the created competition
//
// It does NOT:
// - prepare athletes
// - start live competition
// - set competition format
// - calculate calling order
// =====================================

export const createCompetitionController =
    async (
        req,
        res
    ) => {

        try {

            const competition =
                await createCompetition(
                    req.body
                );


            return res.status(201).json({

                success: true,

                message:
                    "Competition created successfully.",

                data:
                    competition,

            });

        } catch (error) {

            return res.status(
                error.statusCode ?? 400
            ).json({

                success: false,

                message:
                    error.message,

            });

        }

    };
// =====================================
// GET COMPETITION BY ID
// =====================================

export const getCompetitionByIdController = async (
    req,
    res
) => {

    try {

        const competition =
            await getCompetitionById(
                req.params.id
            );

        return res.status(200).json({

            success: true,

            data: competition,

        });

    } catch (error) {

        return res.status(
            error.statusCode ?? 404
        ).json({

            success: false,

            message: error.message,

        });

    }

};


// =====================================
// SET COMPETITION FORMAT
//
// PATCH /competition/:id/format
//
// Body:
//
// {
//     "competitionFormat":
//         "TOTAL_ONLY"
// }
//
// OR
//
// {
//     "competitionFormat":
//         "SEPARATE_LIFT_CLASSIFICATION"
// }
//
// This controller only exposes the
// authoritative mutation service.
//
// It does NOT:
// - start live competition
// - modify LiveCompetition
// - change phase
// - calculate queue
// =====================================

export const setCompetitionFormatController =
    async (
        req,
        res
    ) => {

        try {

            const {
                competitionFormat,
            } = req.body;


            const competition =
                await setCompetitionFormat({

                    competitionId:
                        req.params.id,

                    competitionFormat,

                });


            return res.status(200).json({

                success: true,

                message:
                    "Competition format established successfully.",

                data: {

                    competitionId:
                        competition._id,

                    competitionFormat:
                        competition.competitionFormat,

                },

            });

        } catch (error) {

            return res.status(
                error.statusCode ?? 400
            ).json({

                success: false,

                message:
                    error.message,

                code:
                    error.code ?? null,

            });

        }

    };
    