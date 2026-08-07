import { generateWorkingSheetService } from "../services/pdf/workingSheet/workingSheetService.js";
import buildWorkingSheetData from "../services/pdf/workingSheet/buildWorkingSheetData.js";
export const generateWorkingSheetController = async (req, res) => {

    try {

        const { competitionId ,gender} = req.params;

        const pdf = await generateWorkingSheetService(
            competitionId,
            gender
        );

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            "inline; filename=WorkingSheet.pdf"
        );

        return res.send(pdf);

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }

};
export const getWorkingSheetDataController = async (
    req,
    res
) => {

    try {

        const { competitionId, gender } = req.params;

        const workingSheetData =
            await buildWorkingSheetData(
                competitionId,
                gender
            );

        const athletes = workingSheetData.flatMap(
    (group) => group.athletes
);

return res.status(200).json({
    success: true,
    count: athletes.length,
    data: athletes,
});

    } catch (error) {

        return res.status(500).json({
            success: false,
            message: error.message,
        });

    }

};