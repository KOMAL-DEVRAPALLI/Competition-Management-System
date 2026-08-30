import express from "express";
import createOfficialAthleteController
    from "../controllers/officialAthleteController.js";

import authMiddleware
    from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    createOfficialAthleteController
);

export default router;