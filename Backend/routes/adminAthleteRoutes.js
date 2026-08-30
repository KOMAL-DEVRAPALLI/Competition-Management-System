import express from "express";

import authMiddleware
    from "../middleware/authMiddleware.js";

import {
    addAthleteController,
} from "../controllers/admin/addAthleteController.js";


const router =
    express.Router();


// =====================================
// ADD ATHLETE TO COMPETITION
//
// POST
// /admin/competition/:competitionId/athletes
//
// Protected: Admin only
// =====================================

router.post(

    "/competition/:competitionId/athletes",

    authMiddleware,

    addAthleteController

);


export default router;