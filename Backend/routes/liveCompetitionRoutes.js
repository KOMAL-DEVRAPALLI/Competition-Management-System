import express from "express";

import {
    startLiveCompetitionController,
    processLiftController,
    saveDeclaredWeightController,
    updateQueueDeclarationController,
    getLiveCompetitionController,
    selectOfficialAthleteController,
} from "../controllers/liveCompetitionController.js";


const router = express.Router();


// =====================================
// GET LIVE COMPETITION
// =====================================

router.get(
    "/:competitionId/:gender",
    getLiveCompetitionController
);


// =====================================
// START LIVE COMPETITION
// =====================================

router.post(
    "/start/:competitionId/:gender",
    startLiveCompetitionController
);


// =====================================
// SELECT ATHLETE MANUALLY
// =====================================

router.post(
    "/select-official-athlete",
    selectOfficialAthleteController
);


// =====================================
// PROCESS LIFT
// =====================================

router.post(
    "/process-lift",
    processLiftController
);


// =====================================
// SAVE DECLARED WEIGHT
// =====================================

router.patch(
    "/declared-weight",
    saveDeclaredWeightController
);


// =====================================
// UPDATE QUEUE DECLARATION
//
// Kept for compatibility.
// =====================================

router.patch(
    "/queue-declaration",
    updateQueueDeclarationController
);


export default router;