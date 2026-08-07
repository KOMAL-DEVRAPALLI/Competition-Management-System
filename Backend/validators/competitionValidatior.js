export const validateCompetitionEntry = (req, res, next) => {

    const { competitionId, athleteId } = req.body;

    if (!competitionId) {
        return res.status(400).json({
            success: false,
            message: "Competition is required."
        });
    }

    if (!athleteId) {
        return res.status(400).json({
            success: false,
            message: "Athlete is required."
        });
    }

    next();
};