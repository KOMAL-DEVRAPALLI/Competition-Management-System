import createCompetitionEntry from "../services/competitionEntry/createCompetitionEntry.js";
import getCompetitionEntry from "../services/competitionEntry/getCompetitionEntry.js";
import updateWeighIn from "../services/competitionEntry/updateWeighIn.js";
import updateOpeningLifts from "../services/competitionEntry/updateOpeniningLifts.js";
import updateSnatchAttempts from "../services/competitionEntry/updateSnatchAttempt.js";
import updateCleanJerkAttempts from "../services/competitionEntry/updateCleanJerkAttempt.js";
import getCompetitionEntries from "../services/competitionEntry/getCompetitionEntries.js";
import getCompetitionEntryById from "../services/competitionEntry/getCompetitionEntryByIdController.js";
import prepareCompetition from "../services/competitionEntry/prepareCompetition.js";
import getEligibleWeightCategories from "../services/competitionEntry/getEligibleWeightCategories.js";
import startLiveCompetition from "../services/liveCompetition/startLiveCompetition.js";
export const getEligibleWeightCategoriesController = async (
    req,
    res
) => {

    try {

        const result =
            await getEligibleWeightCategories(
                req.params.id,
                req.body.bodyWeight
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
export const startLiveCompetitionController = async (
    req,
    res
) => {

    try {

        const { competitionId, gender } = req.params;

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
export const prepareCompetitionController = async (req, res) => {
    try {

        const result = await prepareCompetition(
            req.params.competitionId
        );

        return res.status(200).json({
            success: true,
            message: "Competition prepared successfully.",
            data: result,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};
export const createCompetitionEntryController = async (
    req,
    res
) => {
    try {

        const competitionEntry =
            await createCompetitionEntry(req.body);

        return res.status(201).json({
            success: true,
            message: "Competition entry created successfully.",
            data: competitionEntry,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }
};
export const getCompetitionEntryController = async (
    req,
    res
) => {
    
    try {
        
        const { competitionId, athleteId } = req.params;

        const competitionEntry =
            await getCompetitionEntry(
                competitionId,
                athleteId
            );

        return res.status(200).json({
            success: true,
            data: competitionEntry,
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message,
        });

    }
};

export const updateWeighInController = async (
    req,
    res
) => {

    try {

        const competitionEntry =
            await updateWeighIn(
                req.params.id,
                req.body,
                null
            );

        return res.status(200).json({
            success: true,
            message: "Weigh-in updated successfully.",
            data: competitionEntry,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};

export const updateOpeningLiftsController = async (
    req,
    res
) => {

    try {

        const {
            competitionId,
            athleteId,
            snatch,
            cleanJerk,
        } = req.body;

        const result =
            await updateOpeningLifts({
                competitionId,
                athleteId,
                snatch,
                cleanJerk,
            });

        return res.status(200).json({
            success: true,
            message: "Opening lifts updated successfully.",
            data: result,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};

export const updateSnatchAttemptsController = async (
    req,
    res
) => {

    try {

        const competitionEntry =
            await updateSnatchAttempts(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Snatch attempts updated successfully.",
            data: competitionEntry,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};

export const updateCleanJerkAttemptsController = async (
    req,
    res
) => {

    try {

        const competitionEntry =
            await updateCleanJerkAttempts(
                req.params.id,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Clean & Jerk attempts updated successfully.",
            data: competitionEntry,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};
export const getCompetitionEntriesController = async (
    req,
    res
) => {

    try {

        const { competitionId, gender } = req.params;
        
const competitionEntries =
    await getCompetitionEntries(
        competitionId,
        gender
    );

        return res.status(200).json({
            success: true,
            count: competitionEntries.length,
            data: competitionEntries,
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }

};

export const getCompetitionEntryByIdController = async (req, res) => {

    try {

        const competitionEntry = await getCompetitionEntryById(req.params.id);

        return res.status(200).json({
            success: true,
            data: competitionEntry,
        });

    } catch (error) {

        return res.status(404).json({
            success: false,
            message: error.message,
        });

    }

};