import Competition from "../../models/Competition.js";

const createCompetition = async (competitionData) => {

    const competition = await Competition.create({

        // =====================================
        // BASIC COMPETITION INFORMATION
        // =====================================

        competitionName:
            competitionData.competitionName,

        competitionType:
            competitionData.competitionType ??
            "ASSOCIATION",

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


        // =====================================
        // REGISTRATION PERIOD
        // =====================================

        registrationStart:
            competitionData.registrationStart,

        registrationEnd:
            competitionData.registrationEnd,


        // =====================================
        // COMPETITION FEATURES
        // =====================================

        features:
            competitionData.features,


        // =====================================
        // COMPETITION WORKFLOW
        // =====================================

        workflow:
            competitionData.workflow,


        // =====================================
        // ATHLETE REQUIREMENTS
        // =====================================

        athleteRequirements:
            competitionData.athleteRequirements,


        // =====================================
        // ELIGIBILITY
        // =====================================

        eligibilityRules:
            competitionData.eligibilityRules,


        // =====================================
        // WEIGHT CATEGORIES
        // =====================================

        weightCategories:
            competitionData.weightCategories,


        // =====================================
        // COMPETITION RULES
        // =====================================

        rules:
            competitionData.rules,


        // =====================================
        // STATUS
        // =====================================

        status:
            competitionData.status ??
            "UPCOMING",

    });


    return competition;

};

export default createCompetition;