import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;


// =====================================
// COMMON API REQUEST
// =====================================
//
// Authentication:
// - Backend stores JWT in HTTP-only cookie.
// - withCredentials sends that cookie.
// - Frontend never reads/stores the JWT.
//
// Signature:
// apiRequest(url, method, body)
// =====================================

export const apiRequest = async (
    url,
    method = "GET",
    body = null
) => {

    try {

        const response =
            await axios({

                url:
                    BASE_URL + url,

                method,

                data:
                    body,

                withCredentials:
                    true,

            });


        return response.data;


    } catch (error) {

        if (error.response) {

            console.error(
                "Response Error:",
                error.response.data
            );


        } else if (error.request) {

            console.error(
                "No response received from server."
            );


        } else {

            console.error(
                "Request Error:",
                error.message
            );

        }


        throw error;

    }

};


// =====================================
// ADMIN ATHLETES
// =====================================


// -------------------------------------
// ADD NEW ATHLETE TO COMPETITION
// -------------------------------------

export const addAthleteToCompetition = async (
    competitionId,
    athleteData
) => {

    return await apiRequest(

        `/admin/competition/${competitionId}/athletes`,

        "POST",

        athleteData

    );

};


// -------------------------------------
// CREATE COMPETITION ENTRY
// -------------------------------------

export const createCompetitionEntry = async (
    entryData
) => {

    return await apiRequest(

        "/competition-entry",

        "POST",

        entryData

    );

};


// =====================================
// REGISTRATION RECEIPT
// =====================================

export const downloadReceipt = async (
    registrationNo
) => {

    const response =
        await axios({

            url:
                `${BASE_URL}/download-receipt/${registrationNo}`,

            method:
                "GET",

            responseType:
                "blob",

            withCredentials:
                true,

        });


    const blob =
        new Blob(
            [response.data],
            {
                type:
                    "application/pdf",
            }
        );


    const url =
        window.URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;

    link.download =
        `${registrationNo}.pdf`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    window.URL.revokeObjectURL(
        url
    );

};


// =====================================
// AUTHENTICATION
// =====================================


// -------------------------------------
// ADMIN LOGIN
// -------------------------------------

export const loginAdmin = async (
    email,
    password
) => {

    return await apiRequest(

        "/auth/login",

        "POST",

        {
            email,
            password,
        }

    );

};


// -------------------------------------
// GET CURRENT ADMIN
// -------------------------------------

export const getCurrentAdmin = async () => {

    return await apiRequest(

        "/auth/me",

        "GET"

    );

};


// -------------------------------------
// LOGOUT
// -------------------------------------

export const logoutAdmin = async () => {

    return await apiRequest(

        "/auth/logout",

        "POST"

    );

};


// =====================================
// COMPETITION
// =====================================


// -------------------------------------
// CREATE COMPETITION
// -------------------------------------

export const createCompetition = async (
    competitionData
) => {

    return await apiRequest(

        "/competition",

        "POST",

        competitionData

    );

};


// -------------------------------------
// GET COMPETITION BY ID
// -------------------------------------

export const getCompetitionById = async (
    competitionId
) => {

    return await apiRequest(

        `/competition/${competitionId}`,

        "GET"

    );

};


// -------------------------------------
// SET COMPETITION FORMAT
// -------------------------------------

export const setCompetitionFormat = async (
    competitionId,
    competitionFormat
) => {

    return await apiRequest(

        `/competition/${competitionId}/format`,

        "PATCH",

        {
            competitionFormat,
        }

    );

};
export const getEligibleWeightCategories = async ({
    competitionEntryId,
    bodyWeight,
}) => {

    if (!competitionEntryId) {

        throw new Error(
            "Competition entry ID is required."
        );

    }


    const numericBodyWeight =
        Number(bodyWeight);


    if (
        !Number.isFinite(
            numericBodyWeight
        ) ||
        numericBodyWeight <= 0
    ) {

        throw new Error(
            "Valid body weight is required."
        );

    }


    return await apiRequest(

        `/competition-entry/${competitionEntryId}/eligible-categories`,

        "POST",

        {
            bodyWeight:
                numericBodyWeight,
        }

    );

};


// =====================================
// WEIGH-IN
// =====================================


// -------------------------------------
// SAVE WEIGH-IN
// -------------------------------------

export const saveWeighIn = async (
    saveData
) => {

    return await apiRequest(

        "/athlete-weighin/save",

        "PATCH",

        saveData

    );

};


// -------------------------------------
// PREVIEW WEIGH-IN
// -------------------------------------

export const previewWeighIn = async (
    previewData
) => {

    return await apiRequest(

        "/athlete-weighin/preview",

        "POST",

        previewData

    );

};


// =====================================
// OPENING LIFTS
// =====================================


// -------------------------------------
// PREVIEW OPENING LIFTS
// -------------------------------------

export const previewOpeningLifts = async (
    previewData
) => {

    return await apiRequest(

        "/athlete-opening/preview",

        "POST",

        previewData

    );

};


// -------------------------------------
// SAVE OPENING LIFTS
// -------------------------------------

export const saveOpeningLifts = async (
    saveData
) => {

    return await apiRequest(

        "/competition-entry/opening",

        "PATCH",

        saveData

    );

};


// =====================================
// LIVE COMPETITION
// =====================================


// -------------------------------------
// MANUAL OFFICIAL ATHLETE SELECTION
//
// Kept temporarily for existing
// functionality.
//
// Do not use for the new automatic
// queue workflow.
// -------------------------------------

export const selectOfficialAthlete =
    async (
        selectionData
    ) => {

        return await apiRequest(

            "/live-competition/select-official-athlete",

            "POST",

            selectionData

        );

    };


// -------------------------------------
// PROCESS GOOD / NO LIFT
// -------------------------------------

export const processLift = async (
    liftData
) => {

    return await apiRequest(

        "/live-competition/process-lift",

        "POST",

        liftData

    );

};


// -------------------------------------
// SAVE DECLARED WEIGHT
// -------------------------------------

export const saveDeclaredWeight =
    async (
        weightData
    ) => {

        return await apiRequest(

            "/live-competition/declared-weight",

            "PATCH",

            weightData

        );

    };