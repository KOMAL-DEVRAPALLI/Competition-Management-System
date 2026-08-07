import Competition from "../../models/Competition.js";
import Athlete from "../../models/Athlete.js";
import CompetitionEntry from "../../models/CompetitionEntry.js";

export const getDashboardData = async () => {

    const totalCompetitions =
        await Competition.countDocuments();

    const totalAthletes =
        await Athlete.countDocuments();

    const maleAthletes =
        await Athlete.countDocuments({
            "personalInfo.gender": "Male"
        });

    const femaleAthletes =
        await Athlete.countDocuments({
            "personalInfo.gender": "Female"
        });

    const preparedEntries =
        await CompetitionEntry.countDocuments();

    const pendingEntries =
    await Athlete.countDocuments({
        "verification.status": "Pending"
    });

    const activeCompetitions =
        await Competition.countDocuments({
            status: "Registration Open"
        });

    const recentCompetitions =
        await Competition.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select(
                "name venue startDate endDate status"
            );

    return {

        totalCompetitions,

        activeCompetitions,

        totalAthletes,

        maleAthletes,

        femaleAthletes,

        preparedEntries,

        pendingEntries,

        recentCompetitions

    };

};