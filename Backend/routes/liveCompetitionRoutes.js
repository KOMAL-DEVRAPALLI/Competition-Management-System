import express from "express";
import {
    startLiveCompetitionController,
    processLiftController,
    saveDeclaredWeightController,
    updateQueueDeclarationController,
    getLiveCompetitionController
} from "../controllers/liveCompetitionController.js";

const router = express.Router();
router.get(
    "/:competitionId/:gender",
    getLiveCompetitionController
);
router.post(
    "/start/:competitionId/:gender",
    startLiveCompetitionController
);
router.post("/process-lift", processLiftController);

router.patch("/declared-weight", saveDeclaredWeightController);

router.patch(
    "/queue-declaration",
    updateQueueDeclarationController
);

export default router;