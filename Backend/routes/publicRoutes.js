import express from "express";
import registerAthleteController from "../controllers/registrationController.js";
import registrationValidator from "../validators/registrationValidator.js";
import eligibilityController from "../controllers/ElibilityController.js";
import weightCategories from "../controllers/WeightCategoryController.js";
import upload from "../middleware/uploadMiddleware.js";
const router = express.Router();
router.post(
    "/register",
    upload.fields([
        { name: "passportPhoto", maxCount: 1 },
        { name: "aadharCard", maxCount: 1 },
        { name: "birthCertificate", maxCount: 1 },
        { name: "iwlfCard", maxCount: 1 }
    ]),
    registrationValidator,
    registerAthleteController
);
router.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Competition Management System API is running"
    });
});
router.post("/eligibility", eligibilityController)
router.post("/weightCategories", weightCategories)
export default router;