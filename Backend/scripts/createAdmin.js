import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import connectDB from "../config/db.js";
import Admin from "../models/Admin.js";

dotenv.config();

const createAdmin = async () => {

    try {

        await connectDB();

        const name = process.env.ADMIN_NAME;
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!name || !email || !password) {
            throw new Error(
                "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD are required."
            );
        }

        const existingAdmin =
            await Admin.findOne({
                email: email.toLowerCase(),
            });

        if (existingAdmin) {

            console.log(
                "Admin already exists."
            );

            process.exit(0);
        }

        const hashedPassword =
            await bcrypt.hash(
                password,
                12
            );

        await Admin.create({

            name,

            email:
                email.toLowerCase(),

            password:
                hashedPassword,

            role: "admin",

        });

        console.log(
            "Admin created successfully."
        );

        process.exit(0);

    } catch (error) {

        console.error(
            "Failed to create admin:",
            error.message
        );

        process.exit(1);

    }
};

createAdmin();