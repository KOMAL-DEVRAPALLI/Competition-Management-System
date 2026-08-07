import express from "express";

import {
    createCompetitionEntryController,
    getCompetitionEntryController,
    getCompetitionEntryByIdController,
    updateWeighInController,
    getEligibleWeightCategoriesController,
    updateOpeningLiftsController,
    updateSnatchAttemptsController,
    updateCleanJerkAttemptsController,
    getCompetitionEntriesController,
    prepareCompetitionController,
    startLiveCompetitionController
} from "../controllers/competitionEntryController.js";
import weighInValidator from "../validators/weighInValidator.js"
const router = express.Router();

router.post("/", createCompetitionEntryController);

// Get one CompetitionEntry by its _id
router.get(
    "/entry/:id",
    getCompetitionEntryByIdController
);
router.post(
    "/live/start/:competitionId/:gender",
    startLiveCompetitionController
);
// Get all entries for a competition
router.get(
    "/competition/:competitionId",
    getCompetitionEntriesController
);

// Get one entry by competitionId + athleteId
router.get(
    "/:competitionId/:athleteId",
    getCompetitionEntryController
);
router.post(
    "/:id/eligible-categories",
    getEligibleWeightCategoriesController
);
router.patch("/:id/weighin", updateWeighInController);

router.patch("/opening", updateOpeningLiftsController);
router.patch("/:id/snatch", updateSnatchAttemptsController);
router.patch("/:id/cleanjerk", updateCleanJerkAttemptsController);
router.post(
    "/prepare/:competitionId",
    prepareCompetitionController
);

export default router;