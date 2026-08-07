import express from "express";
import {
    generateWorkingSheetController,
    getWorkingSheetDataController
} from "../controllers/WorkingSheetController.js";

const router = express.Router();

router.get(
    "/data/:competitionId/:gender",
    getWorkingSheetDataController
);

router.get(
    "/:competitionId/:gender",
    generateWorkingSheetController
);

export default router;