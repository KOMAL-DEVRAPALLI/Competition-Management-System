import { useState, useEffect } from "react";

import {
    getEligibleWeightCategories,
    saveWeighIn,
} from "../../../api/axios.js";

import "./WeighIn.css";


const WeighInSection = ({
    athlete,
    setAthlete,
}) => {

    const [saving, setSaving] =
        useState(false);

    const [loadingCategories, setLoadingCategories] =
        useState(false);

    const [categoryError, setCategoryError] =
        useState("");


    // =====================================
    // OFFICIAL WEIGH-IN DATA
    // =====================================

    const [official, setOfficial] = useState({

        bodyWeight: "",

        lotNumber: "",

    });


    // =====================================
    // CATEGORY CALCULATION RESULT
    // =====================================

    const [categoryResult, setCategoryResult] =
        useState(null);


    // =====================================
    // GET CURRENT COMPETITION ENTRY
    // =====================================
    //
    // athlete.competitionEntries contains
    // CompetitionEntry documents.
    //
    // IMPORTANT:
    // We must use CompetitionEntry._id,
    // NOT athlete._id.
    //
    // =====================================

    const getCompetitionEntry = () => {

        const entries =
            athlete?.competitionEntries;


        if (
            !Array.isArray(entries) ||
            entries.length === 0
        ) {

            return null;

        }


        // =====================================
        // CURRENT COMPETITION ID
        // =====================================

        const currentCompetitionId =
            String(

                athlete?.competition ??
                athlete?.competitionId ??
                ""

            );


        // =====================================
        // FIND MATCHING ENTRY
        // =====================================

        const matchingEntry =
            entries.find((entry) => {

                const entryCompetitionId =
                    entry?.competitionId?._id ??
                    entry?.competitionId ??
                    "";


                return (

                    String(entryCompetitionId) ===
                    currentCompetitionId

                );

            });


        if (matchingEntry) {

            return matchingEntry;

        }


        // =====================================
        // SAFE FALLBACK
        // =====================================

        if (entries.length === 1) {

            return entries[0];

        }


        return null;

    };


    // =====================================
    // CURRENT COMPETITION ENTRY
    // =====================================

    const competitionEntry =
        getCompetitionEntry();


    // =====================================
    // CURRENT COMPETITION ENTRY ID
    // =====================================

    const competitionEntryId =
        competitionEntry?._id ??
        competitionEntry?.id ??
        competitionEntry?.competitionEntryId ??
        null;


    // =====================================
    // LOAD EXISTING WEIGH-IN
    // =====================================

    useEffect(() => {

        const entry =
            getCompetitionEntry();


        if (!entry) {

            setOfficial({

                bodyWeight: "",

                lotNumber: "",

            });

            setCategoryResult(null);

            setCategoryError(
                "Competition entry not found."
            );

            return;

        }


        // =====================================
        // RESTORE EXISTING WEIGH-IN
        // =====================================

        setOfficial({

            bodyWeight:
                entry?.official?.bodyWeight ??
                "",

            lotNumber:
                entry?.official?.lotNumber ??
                "",

        });


        // =====================================
        // RESTORE SAVED CATEGORY
        // =====================================

        const savedCategory =
            entry?.official?.finalWeightCategory ??
            entry?.official?.selectedWeightCategory ??
            null;


        if (savedCategory) {

            setCategoryResult({

                eligibleCategories: [
                    savedCategory,
                ],

                requiresSelection:
                    false,

                assignedCategory:
                    savedCategory,

            });

        }
        else {

            setCategoryResult(null);

        }


        setCategoryError("");

    }, [athlete]);


    // =====================================
    // INPUT CHANGE
    // =====================================

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;


        setOfficial((previous) => ({

            ...previous,

            [name]: value,

        }));


        // =====================================
        // BODY WEIGHT CHANGED
        // =====================================
        //
        // Existing category becomes invalid
        // until backend recalculates it.
        //
        // =====================================

        if (name === "bodyWeight") {

            setCategoryResult(null);

            setCategoryError("");

        }

    };


    // =====================================
    // CALCULATE ELIGIBLE CATEGORY
    // =====================================

    useEffect(() => {

        let cancelled = false;


        const calculateCategory = async () => {

            try {

                // =================================
                // GET BODY WEIGHT
                // =================================

                const numericBodyWeight =
                    Number(
                        official?.bodyWeight
                    );


                // =================================
                // DO NOT CALL API FOR EMPTY/INVALID
                // BODY WEIGHT
                // =================================

                if (
                    official?.bodyWeight === "" ||
                    official?.bodyWeight === null ||
                    official?.bodyWeight === undefined
                ) {

                    setLoadingCategories(false);

                    setCategoryResult(null);

                    setCategoryError("");

                    return;

                }


                if (
                    !Number.isFinite(
                        numericBodyWeight
                    ) ||
                    numericBodyWeight <= 0
                ) {

                    setLoadingCategories(false);

                    setCategoryResult(null);

                    setCategoryError(
                        "Enter a valid body weight."
                    );

                    return;

                }


                // =================================
                // COMPETITION ENTRY VALIDATION
                // =================================
                //
                // IMPORTANT:
                // Use the CompetitionEntry ID.
                //
                // DO NOT use athlete._id.
                //
                // =================================

                if (!competitionEntryId) {

                    setLoadingCategories(false);

                    setCategoryResult(null);

                    setCategoryError(
                        "Competition entry ID is missing."
                    );

                    console.error(
                        "Competition entry ID missing:",
                        {
                            athleteId:
                                athlete?._id,

                            competitionEntries:
                                athlete?.competitionEntries,

                            competitionEntry,
                        }
                    );

                    return;

                }


                // =================================
                // START LOADING
                // =================================

                setLoadingCategories(true);

                setCategoryError("");


                // =================================
                // DEBUG
                // =================================

                console.log(
                    "Calculating weight category:",
                    {

                        athleteId:
                            athlete?._id,

                        competitionId:
                            competitionEntry
                                ?.competitionId?._id ??
                            competitionEntry
                                ?.competitionId ??
                            athlete?.competition ??
                            athlete?.competitionId ??
                            null,

                        competitionEntryId:
                            String(
                                competitionEntryId
                            ),

                        bodyWeight:
                            numericBodyWeight,

                        ageCategory:
                            competitionEntry
                                ?.competitionCategory
                                ?.ageCategory,

                    }
                );


                // =================================
                // BACKEND AUTHORITATIVE CALCULATION
                // =================================
                //
                // Route:
                //
                // POST
                // /api/competition-entry/:id/
                // eligible-categories
                //
                // :id = CompetitionEntry._id
                //
                // =================================

                const response =
                    await getEligibleWeightCategories({

                        competitionEntryId:
                            String(
                                competitionEntryId
                            ),

                        bodyWeight:
                            numericBodyWeight,

                    });


                // =================================
                // REQUEST CANCELLED
                // =================================

                if (cancelled) {

                    return;

                }


                // =================================
                // DEBUG RESPONSE
                // =================================

                console.log(
                    "Weight category API response:",
                    response
                );


                // =================================
                // GET RESULT
                // =================================

                const result =
                    response?.data;


                // =================================
                // VALIDATE RESULT
                // =================================

                if (
                    !result ||
                    !Array.isArray(
                        result.eligibleCategories
                    ) ||
                    result
                        .eligibleCategories
                        .length === 0
                ) {

                    setCategoryResult(null);

                    setCategoryError(
                        "Unable to determine weight category."
                    );

                    return;

                }


                // =================================
                // DEBUG RESULT
                // =================================

                console.log(
                    "Calculated weight category:",
                    result
                );


                // =================================
                // STORE RESULT
                // =================================

                setCategoryResult({

                    eligibleCategories:
                        result.eligibleCategories,

                    requiresSelection:
                        Boolean(
                            result.requiresSelection
                        ),

                    assignedCategory:
                        result.requiresSelection

                            ? null

                            : (
                                result
                                    .assignedCategory ??
                                result
                                    .eligibleCategories[0]
                            ),

                });

            }
            catch (error) {

                if (cancelled) {

                    return;

                }


                // =================================
                // ERROR
                // =================================

                console.error(
                    "Weight category calculation error:",
                    error
                );


                const message =
                    error
                        ?.response
                        ?.data
                        ?.message ??
                    error?.message ??
                    "Unable to calculate weight category.";


                setCategoryResult(null);

                setCategoryError(message);

            }
            finally {

                if (!cancelled) {

                    setLoadingCategories(false);

                }

            }

        };


        calculateCategory();


        // =====================================
        // CLEANUP
        // =====================================

        return () => {

            cancelled = true;

        };


    }, [
        official.bodyWeight,
        competitionEntryId,
        athlete,
    ]);


    // =====================================
    // CATEGORY SELECTION
    // =====================================

    const handleCategoryChange = (
        event
    ) => {

        const selectedCategory =
            event.target.value;


        setCategoryResult(
            (previous) => {

                if (!previous) {

                    return previous;

                }


                return {

                    ...previous,

                    assignedCategory:
                        selectedCategory,

                };

            }
        );

    };


    // =====================================
    // SAVE WEIGH-IN
    // =====================================

    const handleSave = async () => {

        try {

            setSaving(true);


            // =================================
            // BODY WEIGHT
            // =================================

            const bodyWeight =
                Number(
                    official.bodyWeight
                );


            // =================================
            // LOT NUMBER
            // =================================

            const lotNumber =
                Number(
                    official.lotNumber
                );


            // =================================
            // VALIDATE BODY WEIGHT
            // =================================

            if (
                !Number.isFinite(bodyWeight) ||
                bodyWeight <= 0
            ) {

                alert(
                    "Please enter a valid body weight."
                );

                return;

            }


            // =================================
            // VALIDATE LOT NUMBER
            // =================================

            if (
                !Number.isInteger(lotNumber) ||
                lotNumber <= 0
            ) {

                alert(
                    "Please enter a valid lot number."
                );

                return;

            }


            // =================================
            // VALIDATE COMPETITION ENTRY
            // =================================

            if (!competitionEntryId) {

                alert(
                    "Competition entry not found."
                );

                console.error(
                    "Competition entry missing:",
                    {

                        athleteId:
                            athlete?._id,

                        competitionEntries:
                            athlete?.competitionEntries,

                        competitionEntry,

                    }
                );

                return;

            }


            // =================================
            // CATEGORY CALCULATION REQUIRED
            // =================================

            if (!categoryResult) {

                alert(
                    "Please enter the body weight and wait for the weight category to be calculated."
                );

                return;

            }


            // =================================
            // SELECTED CATEGORY
            // =================================

            const selectedCategory =
                categoryResult
                    .assignedCategory;


            if (!selectedCategory) {

                alert(
                    "Please select a weight category."
                );

                return;

            }


            // =================================
            // COMPETITION ID
            // =================================

            const competitionId =
                competitionEntry
                    ?.competitionId?._id ??
                competitionEntry
                    ?.competitionId ??
                athlete?.competition ??
                athlete?.competitionId ??
                null;


            if (!competitionId) {

                alert(
                    "Competition ID not found."
                );

                return;

            }


            // =================================
            // ATHLETE ID
            // =================================

            const athleteId =
                athlete?._id;


            if (!athleteId) {

                alert(
                    "Athlete ID not found."
                );

                return;

            }


            // =================================
            // SAVE DATA
            // =================================

            const saveData = {

                competitionId,

                athleteId,

                bodyWeight,

                lotNumber,

                selectedCategories: {

                    [String(
                        competitionEntryId
                    )]:
                        selectedCategory,

                },

            };


            // =================================
            // DEBUG SAVE
            // =================================

            console.log(
                "Saving weigh-in:",
                saveData
            );


            // =================================
            // SAVE
            // =================================

            const response =
                await saveWeighIn(
                    saveData
                );


            // =================================
            // UPDATE ATHLETE STATE
            // =================================

            if (
                response?.data?.athlete
            ) {

                setAthlete(
                    response.data.athlete
                );

            }
            else if (
                response?.data
            ) {

                setAthlete(
                    response.data
                );

            }


            alert(
                "Weigh-in saved successfully!"
            );

        }
        catch (error) {

            console.error(
                "Failed to save weigh-in:",
                error
            );


            alert(

                error
                    ?.response
                    ?.data
                    ?.message ||

                error?.message ||

                "Unable to save weigh-in."

            );

        }
        finally {

            setSaving(false);

        }

    };


    // =====================================
    // RENDER
    // =====================================

    return (

        <div className="entry-card">

            <div className="entry-card-header success-header">

                <h2 className="entry-card-title">

                    Official Weigh-In

                </h2>

            </div>


            <div className="entry-card-body">

                <div className="form-grid">


                    {/* =============================
                        BODY WEIGHT
                    ============================= */}

                    <div className="form-group">

                        <label>
                            Body Weight (kg)
                        </label>


                        <input

                            type="number"

                            min="1"

                            step="0.001"

                            name="bodyWeight"

                            value={
                                official.bodyWeight
                            }

                            onChange={
                                handleChange
                            }

                        />

                    </div>


                    {/* =============================
                        LOT NUMBER
                    ============================= */}

                    <div className="form-group">

                        <label>
                            Lot Number
                        </label>


                        <input

                            type="number"

                            min="1"

                            name="lotNumber"

                            value={
                                official.lotNumber
                            }

                            onChange={
                                handleChange
                            }

                        />

                    </div>


                    {/* =============================
                        WEIGHT CATEGORY
                    ============================= */}

                    <div className="form-group">

                        <label>
                            Weight Category
                        </label>


                        {/* =========================
                            CALCULATING
                        ========================= */}

                        {loadingCategories && (

                            <input

                                type="text"

                                readOnly

                                value=""

                                placeholder={
                                    "Calculating weight category..."
                                }

                            />

                        )}


                        {/* =========================
                            ERROR
                        ========================= */}

                        {!loadingCategories &&
                            categoryError && (

                            <div className="category-error">

                                {categoryError}

                            </div>

                        )}


                        {/* =========================
                            BEFORE CALCULATION
                        ========================= */}

                        {!loadingCategories &&
                            !categoryError &&
                            !categoryResult && (

                            <input

                                type="text"

                                readOnly

                                value=""

                                placeholder={

                                    official.bodyWeight

                                        ? "Calculating..."

                                        : "Enter body weight"

                                }

                            />

                        )}


                        {/* =========================
                            CATEGORY RESULT
                        ========================= */}

                        {!loadingCategories &&
                            !categoryError &&
                            categoryResult && (

                            <div className="preview-entry">


                                {/* =====================
                                    AGE CATEGORY
                                ===================== */}

                                <div className="preview-age-category">

                                    <strong>

                                        {
                                            competitionEntry
                                                ?.competitionCategory
                                                ?.ageCategory ??
                                            ""
                                        }

                                    </strong>

                                </div>


                                {/* =====================
                                    SINGLE CATEGORY
                                ===================== */}

                                {!categoryResult
                                    .requiresSelection && (

                                    <input

                                        type="text"

                                        readOnly

                                        value={
                                            categoryResult
                                                .assignedCategory ??
                                            ""
                                        }

                                    />

                                )}


                                {/* =====================
                                    MULTIPLE CATEGORIES
                                ===================== */}

                                {categoryResult
                                    .requiresSelection && (

                                    <select

                                        value={

                                            categoryResult
                                                .assignedCategory ??
                                            ""

                                        }

                                        onChange={
                                            handleCategoryChange
                                        }

                                    >

                                        <option value="">

                                            Select Weight Category

                                        </option>


                                        {categoryResult
                                            .eligibleCategories
                                            .map(
                                                (category) => (

                                                    <option

                                                        key={
                                                            category
                                                        }

                                                        value={
                                                            category
                                                        }

                                                    >

                                                        {category}

                                                    </option>

                                                )
                                            )}

                                    </select>

                                )}

                            </div>

                        )}

                    </div>

                </div>


                {/* =================================
                    SAVE BUTTON
                ================================= */}

                <div className="form-actions">

                    <button

                        type="button"

                        className="save-btn"

                        onClick={
                            handleSave
                        }

                        disabled={
                            saving ||
                            loadingCategories
                        }

                    >

                        {

                            saving

                                ? "Saving..."

                                : "Save Weigh-In"

                        }

                    </button>

                </div>

            </div>

        </div>

    );

};


export default WeighInSection;