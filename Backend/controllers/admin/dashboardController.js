import { getDashboardData } from "../../services/admin/dashboardService.js";

export const dashboardController = async (
    req,
    res,
    next
) => {

    try {

        const dashboard =
            await getDashboardData();

        res.status(200).json({

            success: true,

            message: "Dashboard loaded successfully.",

            data: dashboard

        });

    } catch (error) {

        next(error);

    }

};