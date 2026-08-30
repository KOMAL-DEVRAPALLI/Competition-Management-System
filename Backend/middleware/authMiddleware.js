import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const authMiddleware = async (req, res, next) => {
    try {

        const token = req.cookies?.adminToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing.");
            
            return res.status(500).json({
                success: false,
                message: "Authentication server configuration is incomplete.",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const admin = await Admin.findById(
            decoded.adminId
        ).select("-password");

        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Authenticated admin not found.",
            });
        }

        req.admin = admin;

        next();

    } catch (error) {

        console.error(
            "Authentication middleware error:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication.",
        });
    }
};

export default authMiddleware;