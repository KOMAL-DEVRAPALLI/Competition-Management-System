import { apiRequest } from "../api/axios.js";

const calculateEligibility  = async (dob)=>{
    
    const response = await apiRequest("/eligibility" , "POST" , {dob})
    return response 
}
export default calculateEligibility 