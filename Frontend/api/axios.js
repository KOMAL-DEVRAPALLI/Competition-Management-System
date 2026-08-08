import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

// =====================================
// COMMON API REQUEST
// =====================================

export const apiRequest = async (
    url,
    method,
    body = null
) => {

    try {

        const response = await axios({
            url: BASE_URL + url,
            method,
            data: body,
        });

        return response.data;

    } catch (error) {

        if (error.response) {

            alert(
                "Response Error:\n" +
                JSON.stringify(
                    error.response.data,
                    null,
                    2
                )
            );

            console.log(
                error.response?.data
            );

        } else if (error.request) {

            alert(
                "No response received from server."
            );

        } else {

            alert(
                "Error: " +
                error.message
            );

        }

        throw error;
    }
};


// =====================================
// ELIGIBLE WEIGHT CATEGORIES
// =====================================

export const getEligibleWeightCategories =
    async (
        entryId,
        bodyWeight
    ) => {

        return await apiRequest(
            `/competition-entry/${entryId}/eligible-categories`,
            "POST",
            {
                bodyWeight,
            }
        );

    };


// =====================================
// WEIGH-IN
// =====================================

export const saveWeighIn = async (
    saveData
) => {

    return await apiRequest(
        "/athlete-weighin/save",
        "PATCH",
        saveData
    );

};


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

export const previewOpeningLifts = async (
    previewData
) => {

    return await apiRequest(
        "/athlete-opening/preview",
        "POST",
        previewData
    );

};


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
// Select athlete manually
//
// Official chooses exactly which athlete
// goes to the platform.
//
// NO automatic athlete selection.
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
// Process GOOD / NO LIFT
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
// Save declaration for current athlete
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


// -------------------------------------
// Update declaration from queue
//
// Kept for compatibility with existing
// code. The new LiveScore flow should
// primarily use saveDeclaredWeight()
// for the manually selected athlete.
// -------------------------------------

export const updateQueueDeclaration =
    async (
        declarationData
    ) => {

        return await apiRequest(
            "/live-competition/queue-declaration",
            "PATCH",
            declarationData
        );

    };


// =====================================
// RECEIPT DOWNLOAD
// =====================================

export const downloadReceipt = async (
    registrationNo
) => {

    try {

        const response = await axios({
            url:
                `${BASE_URL}/public/download-receipt/${registrationNo}`,
            method: "GET",
            responseType: "blob",
        });

        const fileURL =
            window.URL.createObjectURL(
                new Blob(
                    [response.data],
                    {
                        type:
                            "application/pdf",
                    }
                )
            );

        const link =
            document.createElement("a");

        link.href = fileURL;

        link.download =
            `${registrationNo}.pdf`;

        document.body.appendChild(link);

        link.click();

        document.body.removeChild(link);

        window.URL.revokeObjectURL(
            fileURL
        );

    } catch (error) {

        console.error(error);

        alert(
            "Failed to download receipt."
        );

    }

};