import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import publicRoutes from "./routes/publicRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import connectDB from "./config/db.js";
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");
dotenv.config();

const app = express();
connectDB()
app.use(cors());
app.use(express.json());

app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});