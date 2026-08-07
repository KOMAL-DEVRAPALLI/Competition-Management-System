import { apiRequest } from "../api/axios.js"; // adjust path if needed

export const getCompetitionEntries = async (competitionId) => {
    return await apiRequest(
        `/competition-entry/competition/${competitionId}`,
        "GET"
    );
};
export const getAthleteWeighInDetails = async({competitionId,athleteId})=>{
    return await apiRequest(
        `/athlete-weighin/${competitionId}/${athleteId}`,
        "GET"
    )
}
export const getCompetitionEntry = async (
    competitionId,
    athleteId
) => {
    return await apiRequest(
        `/competition-entry/${competitionId}/${athleteId}`,
        "GET"
    );
};

export const createCompetitionEntry = async (data) => {
    return await apiRequest(
        "/competition-entry",
        "POST",
        data
    );
};

export const updateWeighIn = async (entryId, data) => {
    return await apiRequest(
        `/competition-entry/${entryId}/weighin`,
        "PATCH",
        data
    );
};

export const updateOpeningLifts = async (entryId, data) => {
    return await apiRequest(
        `/competition-entry/${entryId}/opening`,
        "PATCH",
        data
    );
};

export const updateSnatchAttempts = async (entryId, data) => {
    return await apiRequest(
        `/competition-entry/${entryId}/snatch`,
        "PATCH",
        data
    );
};

export const updateCleanJerkAttempts = async (entryId, data) => {
    return await apiRequest(
        `/competition-entry/${entryId}/cleanjerk`,
        "PATCH",
        data
    );
};

export const getCompetitionEntryById = async (entryId) => {
    return await apiRequest(
        `/competition-entry/entry/${entryId}`
    );
    return response.data;
};