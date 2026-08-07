import getCompetitionById from "../services/competition/getCompetitionById.js";

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

        return res.status(404).json({

            success: false,

            message: error.message,

        });

    }

};