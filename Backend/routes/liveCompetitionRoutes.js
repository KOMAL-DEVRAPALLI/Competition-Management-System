import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import requireAdmin from "../middleware/requireAdmin.js";

import {
    startLiveCompetitionController,
    processLiftController,
    saveDeclaredWeightController,
    getLiveCompetitionController,
    selectOfficialAthleteController,
    getQueueStateController
} from "../controllers/liveCompetitionController.js";


const router = express.Router();
router.use(
    authMiddleware,
    requireAdmin
);
router.get(
    "/:competitionId/:gender/queue",
    getQueueStateController
);


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




export default router;