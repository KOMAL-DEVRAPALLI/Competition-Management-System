import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import requireAdmin from "../middleware/requireAdmin.js";

import {
    createCompetitionController,
    getCompetitionByIdController,

    setCompetitionFormatController,

} from "../controllers/CompetitionController.js";


const router = express.Router();

router.use(
    authMiddleware,
    requireAdmin
);
// =====================================
// SET COMPETITION FORMAT
//
// PATCH /competition/:id/format
//
// Must happen before live competition
// becomes active.
//
// Body:
//
// {
//     "competitionFormat": "TOTAL_ONLY"
// }
//
// =====================================
router.post(
    "/",
    createCompetitionController
);
router.patch(

    "/:id/format",

    setCompetitionFormatController

);


// =====================================
// GET COMPETITION
//
// GET /competition/:id
//
// Returns complete competition details.
// =====================================

router.get(

    "/:id",

    getCompetitionByIdController

);


export default router;