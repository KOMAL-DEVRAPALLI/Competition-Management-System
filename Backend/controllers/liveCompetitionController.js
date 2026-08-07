import processLift from "../services/liveCompetition/processLift.js";
import saveDeclaration from "../services/liveCompetition/saveDeclaration.js";
import startLiveCompetition from "../services/liveCompetition/startLiveCompetition.js";
import updateQueueDeclaration from "../services/liveCompetition/updateQueueDeclaration.js";
import getLiveCompetition from "../services/liveCompetition/getLiveCompetition.js";
export const getLiveCompetitionController = async (
    req,
    res
) => {

    try {

        const {
            competitionId,
            gender,
        } = req.params;

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

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};
export const updateQueueDeclarationController = async (
    req,
    res
) => {

    try {

        const result =
            await updateQueueDeclaration(req.body);

        return res.status(200).json({
            success: true,
            message:
                "Queue declaration updated successfully.",
            data: result,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};
export const startLiveCompetitionController = async (
    req,
    res
) => {

    try {

        const {
            competitionId,
            gender,
        } = req.params;

        const {
            sessionName = "",
            selectedWeightCategories = [],
        } = req.body;

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

            data: result,

        });

    } catch (error) {

        return res.status(400).json({

            success: false,

            message: error.message,

        });

    }

};

export const processLiftController = async (
    req,
    res
) => {

    try {

        const {
            entryId,
            competitionId,
            gender,
            result,
        } = req.body;

        const data = await processLift({
            entryId,
            competitionId,
            gender,
            result,
        });

        return res.status(200).json({
            success: true,
            message: "Lift processed successfully.",
            data,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};
export const saveDeclaredWeightController = async (
    req,
    res
) => {
    console.log("PATCH /declared-weight", req.body);
    try {

        const result = await saveDeclaration(req.body);

        return res.status(200).json({
            success: true,
            message: "Declared weight updated successfully.",
            data: result,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};