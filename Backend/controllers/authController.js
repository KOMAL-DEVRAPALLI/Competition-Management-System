import loginAdmin from "../services/auth/authService.js";

export const loginController = async (req, res) => {

    try {

        const {
            email,
            password,
        } = req.body;

        const result =
            await loginAdmin(
                email,
                password
            );

       res.cookie(
    "adminToken",
    result.token,
    {
        httpOnly: true,

        secure: true,

        sameSite: "none",

        maxAge:
            8 * 60 * 60 * 1000,
    }
);
        return res.status(200).json({

            success: true,

            message:
                "Login successful.",

            data: {
                admin:
                    result.admin,
            },

        });

        } catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        return res.status(
            error.statusCode ?? 500
        ).json({

            success: false,

            message:
                error.message,

        });

    }
};


export const meController = async (
    req,
    res
) => {

    return res.status(200).json({

        success: true,

        data: {
            admin: req.admin,
        },

    });

};


export const logoutController = async (
    req,
    res
) => {

    res.clearCookie(
        "adminToken",
        {
            httpOnly: true,

            secure:
                process.env.NODE_ENV ===
                "production",

            sameSite:
                process.env.NODE_ENV ===
                "production"
                    ? "none"
                    : "lax",
        }
    );

    return res.status(200).json({

        success: true,

        message:
            "Logged out successfully.",

    });

};
