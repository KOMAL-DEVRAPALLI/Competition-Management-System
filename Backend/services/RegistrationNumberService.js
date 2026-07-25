

import Competition from "../models/Competition.js"
import Counter from "../models/Counter.js"

const generateRegistrationNumber = async ()=>{
    const competition = await Competition.findOne({status:"Registration Open"})

    if(!competition){
         throw new Error("No competition is currently open for registration.")
    }
    const registrationPrefix = competition.registrationPrefix

    const counter = await Counter.findOneAndUpdate(
        {_id: "registration"},
        {$inc : {"sequence":1}},
        {new : true}
    )
    console.log("Counter:", counter);
console.log("Sequence:", counter.sequence);
    if (!counter) {
    throw new Error("Registration counter not found.");
}
    const sequence = counter.sequence.toString().padStart(3,'0')
    const registrationNumber = `${registrationPrefix}-${sequence}`

    return {registrationNumber,competition}
}
export default generateRegistrationNumber;