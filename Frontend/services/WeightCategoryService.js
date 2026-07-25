import {apiRequest } from "../api/axios.js";
const getWeightCategories  = async (gender,category)=>{
    const response = await apiRequest("/weightCategories" , "POST" ,{ gender,category})
    return response 
}
export default getWeightCategories 
