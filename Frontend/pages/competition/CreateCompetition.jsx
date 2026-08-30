import {
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    createCompetition,
} from "../../api/axios.js";

import "./CreateCompetition.css";


const CreateCompetition = () => {

    const navigate =
        useNavigate();


    // =====================================
    // FORM STATE
    // =====================================

    const [
        formData,
        setFormData,
    ] = useState({

        competitionName:
            "",

        competitionType:
            "SCHOOL_GAMES",

        registrationPrefix:
            "",

        year:
            new Date().getFullYear(),

        venue:
            "",

        startDate:
            "",

        endDate:
            "",

    });


    const [
        submitting,
        setSubmitting,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState("");


    // =====================================
    // INPUT CHANGE
    // =====================================

    const handleChange = (
        event
    ) => {

        const {
            name,
            value,
        } = event.target;


        setFormData(
            (previous) => ({

                ...previous,

                [name]:
                    value,

            })
        );


        setError("");

    };


    // =====================================
    // VALIDATION
    // =====================================

    const validateForm = () => {

        if (
            !formData.competitionName.trim()
        ) {

            return "Competition name is required.";

        }


        if (
            !formData.year
        ) {

            return "Competition year is required.";

        }


        if (
            !formData.venue.trim()
        ) {

            return "Venue is required.";

        }


        if (
            !formData.startDate
        ) {

            return "Competition start date is required.";

        }


        if (
            !formData.endDate
        ) {

            return "Competition end date is required.";

        }


        if (
            new Date(formData.endDate) <
            new Date(formData.startDate)
        ) {

            return (
                "Competition end date cannot be before the start date."
            );

        }


        // ---------------------------------
        // Association-specific validation
        // ---------------------------------

        if (
            formData.competitionType ===
            "ASSOCIATION" &&
            !formData.registrationPrefix.trim()
        ) {

            return "Registration prefix is required for association competitions.";

        }


        return "";

    };


    // =====================================
    // SUBMIT
    // =====================================

    const handleSubmit =
        async (event) => {

            event.preventDefault();


            if (submitting) {

                return;

            }


            const validationError =
                validateForm();


            if (validationError) {

                setError(
                    validationError
                );

                return;

            }


            try {

                setSubmitting(true);

                setError("");


                // =================================
                // COMMON COMPETITION DATA
                // =================================

                const competitionData = {

                    competitionName:
                        formData.competitionName.trim(),

                    competitionType:
                        formData.competitionType,

                    year:
                        Number(formData.year),

                    venue:
                        formData.venue.trim(),

                    startDate:
                        formData.startDate,

                    endDate:
                        formData.endDate,


                    // =================================
                    // EXISTING COMPETITION STRUCTURE
                    // =================================

                    eligibilityRules:
                        {},

                    weightCategories:
                        [],


                    // =================================
                    // COMPETITION FEATURES
                    // =================================

                    features: {

                        registration:
                            formData.competitionType ===
                            "ASSOCIATION",

                        registrationNumber:
                            formData.competitionType ===
                            "ASSOCIATION",

                        existingAthleteSelection:
                            true,

                        documents:
                            formData.competitionType ===
                            "ASSOCIATION",

                        coachInformation:
                            formData.competitionType ===
                            "ASSOCIATION",

                        weighIn:
                            true,

                        startList:
                            true,

                        liveScore:
                            true,

                        officialsScreen:
                            true,

                        publicScoreboard:
                            true,

                        receipt:
                            formData.competitionType ===
                            "ASSOCIATION",

                    },


                    // =================================
                    // COMPETITION WORKFLOW
                    // =================================

                    workflow: {

                        allowExistingAthleteSelection:
                            true,

                        allowNewAthleteCreation:
                            true,

                        ageCategoryRequired:
                            true,

                        weightCategoryRequired:
                            true,

                        bodyWeightRequired:
                            true,

                        openingLiftsRequired:
                            true,

                    },


                    // =================================
                    // ATHLETE REQUIREMENTS
                    // =================================
                    //
                    // School Games:
                    // Name
                    // Gender
                    // DOB
                    // Mobile
                    // School
                    //
                    // Association:
                    // Existing registration workflow.
                    //
                    // =================================

                    athleteRequirements: {

                        fullName:
                            true,

                        gender:
                            true,

                        dob:
                            true,

                        phone:
                            formData.competitionType ===
                            "SCHOOL_GAMES",

                        email:
                            formData.competitionType ===
                            "ASSOCIATION",

                        address:
                            formData.competitionType ===
                            "ASSOCIATION",

                        club:
                            formData.competitionType ===
                            "ASSOCIATION",

                        coach:
                            formData.competitionType ===
                            "ASSOCIATION",

                        schoolName:
                            formData.competitionType ===
                            "SCHOOL_GAMES",

                    },

                };


                // =================================
                // ASSOCIATION-ONLY DATA
                // =================================

                if (
                    formData.competitionType ===
                    "ASSOCIATION"
                ) {

                    competitionData.registrationPrefix =
                        formData.registrationPrefix.trim();

                }


                // =================================
                // CREATE COMPETITION
                // =================================

                const response =
                    await createCompetition(
                        competitionData
                    );


                const competition =
                    response?.data;


                const competitionId =
                    competition?._id;


                if (!competitionId) {

                    throw new Error(
                        "Competition was created but no competition ID was returned."
                    );

                }


                alert(
                    response.message ||
                    "Competition created successfully."
                );


                // =================================
                // ENTER ATHLETE WORKFLOW
                // =================================

                navigate(
                    `/admin/competition/${competitionId}/athletes/male`
                );


            } catch (requestError) {

                console.error(
                    "Create competition error:",
                    requestError
                );


                setError(

                    requestError.response
                        ?.data
                        ?.message ||

                    requestError.message ||

                    "Unable to create competition."

                );

            } finally {

                setSubmitting(false);

            }

        };


    // =====================================
    // CANCEL
    // =====================================

    const handleCancel = () => {

        navigate("/admin");

    };


    // =====================================
    // RENDER
    // =====================================

    return (

        <div className="create-competition-page">


            {/* =================================
                HEADER
            ================================= */}

            <div className="create-competition-header">

                <div>

                    <h1>
                        Create Competition
                    </h1>

                    <p>
                        Create a competition before
                        adding competition-specific athletes.
                    </p>

                </div>

            </div>


            {/* =================================
                FORM
            ================================= */}

            <form
                className="create-competition-form"
                onSubmit={handleSubmit}
            >


                {/* ERROR */}

                {error && (

                    <div className="create-competition-error">

                        {error}

                    </div>

                )}


                {/* =================================
                    COMPETITION INFORMATION
                ================================= */}

                <div className="form-section">

                    <h2>
                        Competition Information
                    </h2>


                    <div className="form-grid">


                        {/* COMPETITION TYPE */}

                        <div className="form-group">

                            <label>
                                Competition Type
                            </label>

                            <select
                                name="competitionType"
                                value={
                                    formData.competitionType
                                }
                                onChange={
                                    handleChange
                                }
                            >

                                <option value="SCHOOL_GAMES">
                                    School Games
                                </option>

                                <option value="ASSOCIATION">
                                    Association Competition
                                </option>

                            </select>

                        </div>


                        {/* COMPETITION NAME */}

                        <div className="form-group">

                            <label>
                                Competition Name
                            </label>

                            <input
                                type="text"
                                name="competitionName"
                                value={
                                    formData.competitionName
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder={
                                    formData.competitionType ===
                                    "SCHOOL_GAMES"
                                        ? "U17–U19 Rural Weightlifting School Games"
                                        : "Enter competition name"
                                }
                                autoComplete="off"
                            />

                        </div>


                        {/* YEAR */}

                        <div className="form-group">

                            <label>
                                Year
                            </label>

                            <input
                                type="number"
                                name="year"
                                value={
                                    formData.year
                                }
                                onChange={
                                    handleChange
                                }
                                min="2000"
                            />

                        </div>


                        {/* VENUE */}

                        <div className="form-group">

                            <label>
                                Venue
                            </label>

                            <input
                                type="text"
                                name="venue"
                                value={
                                    formData.venue
                                }
                                onChange={
                                    handleChange
                                }
                                placeholder="Enter competition venue"
                            />

                        </div>


                        {/* =================================
                            ASSOCIATION ONLY
                        ================================= */}

                        {
                            formData.competitionType ===
                            "ASSOCIATION" && (

                                <div className="form-group">

                                    <label>
                                        Registration Prefix
                                    </label>

                                    <input
                                        type="text"
                                        name="registrationPrefix"
                                        value={
                                            formData.registrationPrefix
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        placeholder="Example: SDWC"
                                        autoComplete="off"
                                    />

                                </div>

                            )
                        }

                    </div>

                </div>


                {/* =================================
                    COMPETITION DATES
                ================================= */}

                <div className="form-section">

                    <h2>
                        Competition Dates
                    </h2>


                    <div className="form-grid">


                        {/* START */}

                        <div className="form-group">

                            <label>
                                Competition Start
                            </label>

                            <input
                                type="datetime-local"
                                name="startDate"
                                value={
                                    formData.startDate
                                }
                                onChange={
                                    handleChange
                                }
                            />

                        </div>


                        {/* END */}

                        <div className="form-group">

                            <label>
                                Competition End
                            </label>

                            <input
                                type="datetime-local"
                                name="endDate"
                                value={
                                    formData.endDate
                                }
                                onChange={
                                    handleChange
                                }
                            />

                        </div>

                    </div>

                </div>


                {/* =================================
                    SCHOOL GAMES INFORMATION
                ================================= */}

                {
                    formData.competitionType ===
                    "SCHOOL_GAMES" && (

                        <div className="form-section">

                            <h2>
                                School Games Configuration
                            </h2>

                            <div className="competition-info-box">

                                <p>
                                    This competition uses the
                                    school-games athlete workflow.
                                </p>

                                <ul>

                                    <li>
                                        Age Categories: U17 and U19
                                    </li>

                                    <li>
                                        Athlete source:
                                        Existing athlete or new athlete
                                    </li>

                                    <li>
                                        School name is required
                                    </li>

                                    <li>
                                        Mobile number is required
                                    </li>

                                    <li>
                                        Association registration
                                        information is not required
                                    </li>

                                </ul>

                            </div>

                        </div>

                    )
                }


                {/* =================================
                    ACTIONS
                ================================= */}

                <div className="form-actions">

                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={
                            handleCancel
                        }
                        disabled={
                            submitting
                        }
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={
                            submitting
                        }
                    >

                        {
                            submitting
                                ? "Creating..."
                                : "Create Competition"
                        }

                    </button>

                </div>

            </form>

        </div>

    );

};


export default CreateCompetition;