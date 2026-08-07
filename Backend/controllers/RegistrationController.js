import registerAthlete from "../services/registration/RegistrationService.js";

const registerAthleteController = async (req, res) => {
    try {
        const athlete = await registerAthlete(req.body,req.files)
        res.status(201).json({
            success: true,
            message: "Registration successful",
            data: athlete,
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
export default registerAthleteController