import getWeightCategories from "../services/WeightCategoryService.js"

const weightCategories = async (req,res)=>{
    try{
        console.log(req.body);
        const {gender , category} = req.body
    const weightCategories = await getWeightCategories(gender,category)
    res.status(200).json({
        success: true,
      message: "Weight categories fetched successfully.",
      data: weightCategories,
    });
    }
    catch (error) {
        console.log(error);
        
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
export default weightCategories