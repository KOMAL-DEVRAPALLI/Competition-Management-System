import {
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    addAthleteToCompetition,
} from "../../api/axios.js";

import "./AddAthlete.css";


const AddAthlete = () => {

    const {
        competitionId,
        gender: sessionGender,
    } = useParams();


    const navigate =
        useNavigate();


    // =====================================
    // FORM STATE
    // =====================================

    const [
        formData,
        setFormData,
    ] = useState({

        fullName:
            "",

        phone:
            "",

        dob:
            "",

        schoolName:
            "",

        gender:
            sessionGender?.toLowerCase() ===
            "female"
                ? "Female"
                : "Male",

        ageCategory:
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

    const handleChange =
        (event) => {

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
    // SUBMIT
    // =====================================

    const handleSubmit =
        async (event) => {

            event.preventDefault();


            if (submitting) {

                return;

            }


            // =================================
            // CLIENT-SIDE VALIDATION
            // =================================

            if (
                !formData.fullName.trim()
            ) {

                setError(
                    "Full name is required."
                );

                return;

            }


            if (
                !formData.phone.trim()
            ) {

                setError(
                    "Mobile number is required."
                );

                return;

            }


            if (!formData.dob) {

                setError(
                    "Date of birth is required."
                );

                return;

            }


            if (
                !formData.schoolName.trim()
            ) {

                setError(
                    "School name is required."
                );

                return;

            }


            if (!formData.ageCategory) {

                setError(
                    "Please select U17 or U19."
                );

                return;

            }


            try {

                setSubmitting(true);

                setError("");


                // =================================
                // SEND ATHLETE DATA
                //
                // IMPORTANT:
                // addAthleteToCompetition expects:
                //
                // addAthleteToCompetition(
                //     competitionId,
                //     athleteData
                // )
                // =================================

                const response =
                    await addAthleteToCompetition(

                        competitionId,

                        formData

                    );


                alert(
                    response.message
                );


                // =================================
                // RETURN TO GENDER LIST
                // =================================

                navigate(

                    `/admin/competition/${competitionId}/athletes/${sessionGender}`

                );

            } catch (requestError) {

                console.error(
                    "Add athlete error:",
                    requestError
                );


                setError(

                    requestError.response
                        ?.data
                        ?.message ||

                    requestError.message ||

                    "Unable to add athlete."

                );

            } finally {

                setSubmitting(false);

            }

        };


    // =====================================
    // CANCEL
    // =====================================

    const handleCancel =
        () => {

            navigate(

                `/admin/competition/${competitionId}/athletes/${sessionGender}`

            );

        };


    // =====================================
    // RENDER
    // =====================================

    return (

        <div className="add-athlete-page">


            {/* =================================
                HEADER
            ================================= */}

            <div className="add-athlete-header">

                <h1>
                    Add Athlete
                </h1>

                <p>
                    Add athlete for this competition
                </p>

            </div>


            {/* =================================
                FORM
            ================================= */}

            <form
                className="add-athlete-form"
                onSubmit={handleSubmit}
            >


                {/* =================================
                    ERROR
                ================================= */}

                {error && (

                    <div className="add-athlete-error">

                        {error}

                    </div>

                )}


                {/* =================================
                    FULL NAME
                ================================= */}

                <div className="form-group">

                    <label>
                        Full Name
                    </label>

                    <input
                        type="text"
                        name="fullName"
                        value={
                            formData.fullName
                        }
                        onChange={
                            handleChange
                        }
                        placeholder="Enter athlete full name"
                        autoComplete="off"
                    />

                </div>


                {/* =================================
                    MOBILE NUMBER
                ================================= */}

                <div className="form-group">

                    <label>
                        Mobile Number
                    </label>

                    <input
                        type="tel"
                        name="phone"
                        value={
                            formData.phone
                        }
                        onChange={
                            handleChange
                        }
                        placeholder="Enter mobile number"
                        autoComplete="tel"
                    />

                </div>


                {/* =================================
                    DATE OF BIRTH
                ================================= */}

                <div className="form-group">

                    <label>
                        Date of Birth
                    </label>

                    <input
                        type="date"
                        name="dob"
                        value={
                            formData.dob
                        }
                        onChange={
                            handleChange
                        }
                    />

                </div>


                {/* =================================
                    SCHOOL NAME
                ================================= */}

                <div className="form-group">

                    <label>
                        School Name
                    </label>

                    <input
                        type="text"
                        name="schoolName"
                        value={
                            formData.schoolName
                        }
                        onChange={
                            handleChange
                        }
                        placeholder="Enter school name"
                        autoComplete="organization"
                    />

                </div>


                {/* =================================
                    GENDER
                ================================= */}

                <div className="form-group">

                    <label>
                        Gender
                    </label>

                    <select
                        name="gender"
                        value={
                            formData.gender
                        }
                        onChange={
                            handleChange
                        }
                    >

                        <option value="Male">
                            Male
                        </option>

                        <option value="Female">
                            Female
                        </option>

                    </select>

                </div>


                {/* =================================
                    AGE CATEGORY
                ================================= */}

                <div className="form-group">

                    <label>
                        Age Category
                    </label>

                    <select
                        name="ageCategory"
                        value={
                            formData.ageCategory
                        }
                        onChange={
                            handleChange
                        }
                    >

                        <option value="">
                            Select Age Category
                        </option>

                        <option value="U17">
                            U17
                        </option>

                        <option value="U19">
                            U19
                        </option>

                    </select>

                </div>


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
                                ? "Adding..."
                                : "Add Athlete"
                        }

                    </button>

                </div>


            </form>

        </div>

    );

};


export default AddAthlete;