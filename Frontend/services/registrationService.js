import { apiRequest } from "../api/axios.js";


const registerAthlete = async(formData)=>{
    const response  = await apiRequest("/register" , "POST" , formData)
    return response
}
export default registerAthlete