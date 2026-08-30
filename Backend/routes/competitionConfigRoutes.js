import express from "express";

import {
    getCompetitionConfigController,
    saveCompetitionConfigController,
} from "../controllers/competitionConfigController.js";

import authMiddleware
    from "../middleware/authMiddleware.js";

const router = express.Router();


// =====================================
// GET CONFIG
// =====================================

router.get(
    "/:competitionId",
    authMiddleware,
    getCompetitionConfigController
);


// =====================================
// UPDATE CONFIG
// =====================================

router.patch(
    "/:competitionId",
    authMiddleware,
    saveCompetitionConfigController
);


export default router;