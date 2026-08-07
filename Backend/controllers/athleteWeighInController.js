import previewAthleteWeighIn from "../services/athleteWeighIn/previewAthleteWeighIn.js"
import saveAthleteWeighIn from "../services/athleteWeighIn/saveAthleteWeighIn.js"
import getAthleteWeighInDetails from "../services/athleteWeighIn/getAthleteWeighInDetails.js";
export const previewAthleteWeighInController = async (req, res) => {
    try {
        const { competitionId, athleteId, bodyWeight } = req.body;
        const result = await previewAthleteWeighIn({
            competitionId,
            athleteId,
            bodyWeight
        });
        return res.status(200).json({
            success: true,
            message: "Preview generated successfully.",
            data: result
        });
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
}
export const saveAthleteWeighInController = async (req, res) => {
    try {
        const { competitionId,
            athleteId,
            bodyWeight,
            lotNumber,
            selectedCategories } = req.body
        const result = await saveAthleteWeighIn({
            competitionId,
            athleteId,
            bodyWeight,
            lotNumber,
            selectedCategories
        })
        return res.status(200).json({
            success: true,
            message: "Athlete weighIn saved successfully",
            data: result
        })
    }
    catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}
export const getAthleteWeighInDetailsController = async(req,res)=>{
    try{
        const {competitionId , athleteId} = req.params
        const result = await getAthleteWeighInDetails({
            competitionId,
            athleteId
        })
        return res.status(200).json({
    success: true,
    message: "Athlete weigh-in details fetched successfully.",
    data: result
})
    }
    catch(err){
         return res.status(400).json({
            success: false,
            message: err.message
        })
    }
}