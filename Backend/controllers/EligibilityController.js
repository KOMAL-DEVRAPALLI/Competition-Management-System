import calculateEligibility from "../services/eligibility/EligibilityService.js"

const eligibilityController = async (req,res)=>{
   try{
    
     const {dob } = req.body
  
    const eligibilityData =  await calculateEligibility(dob)
    res.status(200).json({
        success: true,
      message: "Eligibility calculated successfully",
      data: eligibilityData,
    });
   }
   catch(err){
    console.log(err);
    
     res.status(500).json({
            success: false,
            message: err.message,
        });
   }
}
export default eligibilityController