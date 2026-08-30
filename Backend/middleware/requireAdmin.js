const requireAdmin = (req, res, next) => {

    if (!req.admin) {
        return res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
    }

    if (req.admin.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin authorization required.",
        });
    }

    next();
};

export default requireAdmin;