import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
    name :{
        type : String,
        required : true,
        trim: true 
    },
    email :{
        type:String,
        required: true,
        trim: true,
        lowercase: true
    },
    password :{
        type : String,
        required : true,
        trim: true
    },
    role:{
        type : String , 
        enum: ["admin" , "athlete"],
        default:"admin"
    }
},{timestamps:true})

const Admin =  mongoose.model("Admin" ,adminSchema) 
export default Admin