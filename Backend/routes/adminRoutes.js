import { dashboardController } from "../controllers/admin/dashboardController.js";
import e from "express";
const router = e.Router();

router.get(
    "/dashboard",
    dashboardController
);
export default router