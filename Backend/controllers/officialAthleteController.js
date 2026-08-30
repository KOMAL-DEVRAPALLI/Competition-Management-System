import createOfficialAthlete from "../services/athlete/createOfficialAthlete.js";

const createOfficialAthleteController = async (req, res) => {
    try {

        const athlete = await createOfficialAthlete({
            competitionId: req.body.competitionId,
            fullName: req.body.fullName,
            gender: req.body.gender,
            dob: req.body.dob,
            club: req.body.club,
            coach: req.body.coach,
        });

        return res.status(201).json({
            success: true,
            message: "Athlete added successfully.",
            data: athlete,
        });

    } catch (error) {

        console.error(
            "Create official athlete error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message,
        });

    }
};

export default createOfficialAthleteController;