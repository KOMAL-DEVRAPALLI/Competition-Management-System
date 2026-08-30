import Competition from "../../../models/Competition.js";

import { generateWorkingSheet } from "./generateWorkingSheet.js";

import buildWorkingSheetData from "./buildWorkingSheetData.js";


export const generateWorkingSheetService = async (
    competitionId,
    gender,
    ageCategory
) => {

    // =====================================
    // LOAD COMPETITION
    // =====================================

    const competition =
        await Competition.findById(
            competitionId
        );


    if (!competition) {

        throw new Error(
            "Competition not found."
        );

    }


    // =====================================
    // BUILD DATA
    // =====================================

    const workingSheetData =
        await buildWorkingSheetData(
            competitionId,
            gender,
            false,
            [],
            null,
            ageCategory
        );


    console.log(
        "WORKING SHEET SERVICE:",
        {
            competitionId,
            gender,
            ageCategory,
            groups:
                workingSheetData.length,
            competitionName:
                competition.competitionName ||
                competition.name,
        }
    );


    // =====================================
    // GENERATE PDF
    // =====================================

    const pdf =
        await generateWorkingSheet(
            competition,
            workingSheetData,
            gender,
            ageCategory
        );


    return pdf;

};