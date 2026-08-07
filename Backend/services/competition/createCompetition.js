import Competition from "../../models/Competition.js";

const createCompetition = async (competitionData) => {

    const competition = await Competition.create({

        competitionName:
            competitionData.competitionName,

        registrationPrefix:
            competitionData.registrationPrefix,

        year:
            competitionData.year,

        venue:
            competitionData.venue,

        startDate:
            competitionData.startDate,

        endDate:
            competitionData.endDate,

        registrationStart:
            competitionData.registrationStart,

        registrationEnd:
            competitionData.registrationEnd,

        eligibilityRules:
            competitionData.eligibilityRules,

        weightCategories:
            competitionData.weightCategories,

        rules:
            competitionData.rules,

        status:
            competitionData.status ?? "UPCOMING",

    });

    return competition;

};

export default createCompetition;