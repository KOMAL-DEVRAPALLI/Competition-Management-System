import express from "express";
import {
    generateWorkingSheetController,
    getWorkingSheetDataController
} from "../controllers/WorkingSheetController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import requireAdmin from "../middleware/requireAdmin.js";

const router = express.Router();
router.use(
    authMiddleware,
    requireAdmin
);
router.get(
    "/data/:competitionId/:gender",
    getWorkingSheetDataController
);

router.get(
    "/:competitionId/:gender",
    generateWorkingSheetController
);

export default router;