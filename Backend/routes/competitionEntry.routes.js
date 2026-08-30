import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import requireAdmin from "../middleware/requireAdmin.js";

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
} from "../controllers/CompetitionEntryController.js";

const router = express.Router();

router.use(
    authMiddleware,
    requireAdmin
);

router.post(
    "/",
    createCompetitionEntryController
);

// =====================================
// GET ONE COMPETITION ENTRY BY ID
// =====================================

router.get(
    "/entry/:id",
    getCompetitionEntryByIdController
);

// =====================================
// START LIVE COMPETITION
// =====================================

router.post(
    "/live/start/:competitionId/:gender",
    startLiveCompetitionController
);

// =====================================
// GET ALL ENTRIES FOR COMPETITION
// =====================================

router.get(
    "/competition/:competitionId",
    getCompetitionEntriesController
);

// =====================================
// GET ENTRY BY COMPETITION + ATHLETE
// =====================================

router.get(
    "/:competitionId/:athleteId",
    getCompetitionEntryController
);

// =====================================
// CALCULATE ELIGIBLE WEIGHT CATEGORIES
//
// POST
// /api/competition-entry/:id/eligible-categories
//
// :id = CompetitionEntry._id
// =====================================

router.post(
    "/:id/eligible-categories",
    getEligibleWeightCategoriesController
);

// =====================================
// WEIGH-IN
// =====================================

router.patch(
    "/:id/weighin",
    updateWeighInController
);

// =====================================
// OPENING LIFTS
// =====================================

router.patch(
    "/opening",
    updateOpeningLiftsController
);

// =====================================
// SNATCH ATTEMPTS
// =====================================

router.patch(
    "/:id/snatch",
    updateSnatchAttemptsController
);

// =====================================
// CLEAN & JERK ATTEMPTS
// =====================================

router.patch(
    "/:id/cleanjerk",
    updateCleanJerkAttemptsController
);

// =====================================
// PREPARE COMPETITION
// =====================================

router.post(
    "/prepare/:competitionId",
    prepareCompetitionController
);

export default router;