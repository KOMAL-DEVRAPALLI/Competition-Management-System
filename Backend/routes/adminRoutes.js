import express from "express";

import {
    dashboardController,
} from "../controllers/admin/dashboardController.js";

import {
    addAthleteController,
} from "../controllers/admin/addAthleteController.js";

import authMiddleware from "../middleware/authMiddleware.js";


const router = express.Router();


// =====================================
// ADMIN DASHBOARD
// =====================================

router.get(
    "/dashboard",
    authMiddleware,
    dashboardController
);


// =====================================
// ADD ATHLETE TO COMPETITION
//
// POST
// /api/admin/competition/:competitionId/athletes
//
// Current school-games workflow.
//
// Body:
//
// {
//     fullName,
//     phone,
//     dob,
//     schoolName,
//     gender,
//     ageCategory
// }
//
// ageCategory:
// - U17
// - U19
// =====================================

router.post(
    "/competition/:competitionId/athletes",
    authMiddleware,
    addAthleteController
);


export default router;