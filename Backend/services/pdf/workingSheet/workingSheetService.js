import Competition from "../../../models/Competition.js";
import { generateWorkingSheet } from "./generateWorkingSheet.js";
import buildWorkingSheetData from "./buildWorkingSheetData.js";

export const generateWorkingSheetService = async (
    competitionId,
    gender
) => {

    const competition = await Competition.findById(
        competitionId
    );

    if (!competition) {
        throw new Error("Competition not found.");
    }

    const workingSheetData =
        await buildWorkingSheetData(
            competitionId,
            gender
        );

    const pdf = await generateWorkingSheet(
        competition,
        workingSheetData,
        gender
    );

    return pdf;

};