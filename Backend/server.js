

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import publicRoutes from "./routes/publicRoutes.js";
import connectDB from "./config/db.js";
import dns from "dns";
import CompetitionEntryRoutes from "./routes/competitionEntry.routes.js";
import workingSheetRoutes from "./routes/workingSheetRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"
import athleteWeighInRoutes from "./routes/athleteWeighInRoutes.js"
import liveCompetitionRoutes from "./routes/liveCompetitionRoutes.js";

dns.setDefaultResultOrder("ipv4first");
dotenv.config();

const app = express();
connectDB()
app.use(cors({
    origin: [ 
        "https://sdwa-registration-portal.vercel.app",
        "http://localhost:5173",
       ],
    credentials: true,
}));

app.use(express.json());

app.use("/api", publicRoutes);
app.use("/api/competition-entry", CompetitionEntryRoutes);
app.use("/api/working-sheet", workingSheetRoutes);
app.use("/api/live-competition", liveCompetitionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/athlete-weighin", athleteWeighInRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});