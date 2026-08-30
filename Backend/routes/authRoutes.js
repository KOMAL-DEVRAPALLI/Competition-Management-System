import express from "express";

import {
    loginController,
    meController,
    logoutController,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();


// Public
router.post(
    "/login",
    loginController
);


// Protected
router.get(
    "/me",
    authMiddleware,
    meController
);


// Protected
router.post(
    "/logout",
    authMiddleware,
    logoutController
);


export default router;