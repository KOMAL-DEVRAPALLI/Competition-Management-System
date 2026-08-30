import CompetitionConfig from "../../models/CompetitionConfig.js";


// =====================================
// DEFAULT CONFIGURATION
//
// Existing competitions continue to work
// with the existing workflow when no
// explicit configuration exists.
// =====================================

const DEFAULT_CONFIG = {
    athleteWorkflow: {
        allowExistingAthleteSelection: false,
        allowNewAthleteCreation: true,
    },

    registration: {
        enabled: true,
        registrationNumberRequired: true,
    },

    athleteFields: {
        phoneRequired: true,
        emailRequired: true,
        addressRequired: true,
        coachEnabled: true,
        coachRequired: false,
    },

    // =====================================
    // COMPETITION ENTRY FIELDS
    //
    // Controls fields required for an
    // athlete's participation in a specific
    // competition.
    // =====================================

    entryFields: {
        bodyWeightRequired: false,
        weightCategoryRequired: false,
        openingSnatchRequired: false,
        openingCleanJerkRequired: false,
    },

    documents: {
        enabled: true,
        required: true,
    },

    weighIn: {
        enabled: true,
        required: true,
    },

    startList: {
        enabled: true,
    },

    liveScore: {
        enabled: true,
        mode: "WEIGHTLIFTING",
    },

    officialsScreen: {
        enabled: true,
    },

    publicScoreboard: {
        enabled: true,
    },
};


// =====================================
// GET CONFIG
// =====================================

export const getCompetitionConfig =
    async (competitionId) => {

        const config =
            await CompetitionConfig
                .findOne({
                    competitionId,
                })
                .lean();

        if (config) {
            return config;
        }

        return {
            competitionId,
            ...DEFAULT_CONFIG,
        };
    };


// =====================================
// SAVE / UPDATE CONFIG
// =====================================

export const saveCompetitionConfig =
    async (
        competitionId,
        configData
    ) => {

        return await CompetitionConfig.findOneAndUpdate(

            {
                competitionId,
            },

            {
                $set: configData,

                $setOnInsert: {
                    competitionId,
                },
            },

            {
                new: true,
                upsert: true,
                runValidators: true,
            }
        );
    };