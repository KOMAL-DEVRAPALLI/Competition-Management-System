import express from "express";
import {getAthleteWeighInDetailsController, previewAthleteWeighInController , saveAthleteWeighInController } from "../controllers/athleteWeighInController.js";

const router = express.Router()
router.get("/:competitionId/:athleteId" ,getAthleteWeighInDetailsController)
router.post("/preview" , previewAthleteWeighInController)
router.patch("/save" ,saveAthleteWeighInController)

export default router