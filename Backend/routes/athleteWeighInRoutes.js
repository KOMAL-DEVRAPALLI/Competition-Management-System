import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import requireAdmin from "../middleware/requireAdmin.js";

import {getAthleteWeighInDetailsController, previewAthleteWeighInController , saveAthleteWeighInController } from "../controllers/athleteWeighInController.js";

const router = express.Router()
router.use(
    authMiddleware,
    requireAdmin
);
router.get("/:competitionId/:athleteId" ,getAthleteWeighInDetailsController)
router.post("/preview" , previewAthleteWeighInController)
router.patch("/save" ,saveAthleteWeighInController)

export default router