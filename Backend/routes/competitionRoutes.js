import express from "express";

import {
    getCompetitionByIdController,
} from "../controllers/CompetitionController.js";

const router = express.Router();

/*
    GET /competition/:id
    Returns complete competition details
*/
router.get(
    "/:id",
    getCompetitionByIdController
);

export default router;