import Athlete from "../models/Athlete.js";
import Competition from "../models/Competition.js";
import generateRegistrationPDF from "../services/pdfService/PdfService.js";
import fs from "fs";

export const downloadReceiptController = async (req, res) => {
    try {
    

        const { registrationNo } = req.params;

        const athlete = await Athlete.findOne({ registrationNo });

        if (!athlete) {
            return res.status(404).json({
                success: false,
                message: "Athlete not found",
            });
        }

        const competition = await Competition.findOne({
            status: "Registration Open",
        });

        const pdfPath = await generateRegistrationPDF(
            athlete,
            competition
        );

        res.download(pdfPath, `${registrationNo}.pdf`, (err) => {

            if (fs.existsSync(pdfPath)) {
                fs.unlinkSync(pdfPath);
            }

            if (err) {
                console.error("Download Error:", err);
            } else {
                console.log("Download completed successfully.");
            }
        });

    } catch (error) {
        console.error("Controller Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to download receipt",
        });
    }
};