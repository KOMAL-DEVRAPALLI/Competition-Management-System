import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../../models/Admin.js";

const loginAdmin = async (email, password) => {

    const normalizedEmail =
        String(email ?? "")
            .trim()
            .toLowerCase();

    if (!normalizedEmail || !password) {

        const error =
            new Error(
                "Email and password are required."
            );

        error.statusCode = 400;

        throw error;
    }


    // =====================================
    // FIND ADMIN
    // =====================================

    const admin =
        await Admin.findOne({
            email: normalizedEmail,
        });

    if (!admin) {

        const error =
            new Error(
                "Invalid email or password."
            );

        error.statusCode = 401;

        throw error;
    }


    // =====================================
    // PASSWORD
    // =====================================

    const passwordValid =
        await bcrypt.compare(
            password,
            admin.password
        );

    if (!passwordValid) {

        const error =
            new Error(
                "Invalid email or password."
            );

        error.statusCode = 401;

        throw error;
    }


    // =====================================
    // ROLE
    // =====================================

    if (admin.role !== "admin") {

        const error =
            new Error(
                "You are not authorized as an official."
            );

        error.statusCode = 403;

        throw error;
    }


    // =====================================
    // JWT SECRET CHECK
    // =====================================

    if (!process.env.JWT_SECRET) {

        console.error(
            "JWT_SECRET is missing from environment variables."
        );

        const error =
            new Error(
                "Authentication server configuration is incomplete."
            );

        error.statusCode = 500;

        throw error;
    }


    // =====================================
    // GENERATE TOKEN
    // =====================================

    const token =
        jwt.sign(
            {
                adminId:
                    admin._id.toString(),

                role:
                    admin.role,
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "8h",
            }
        );


    // =====================================
    // RETURN
    // =====================================

    return {

        token,

        admin: {

            id:
                admin._id,

            name:
                admin.name,

            email:
                admin.email,

            role:
                admin.role,

        },

    };

};

export default loginAdmin;