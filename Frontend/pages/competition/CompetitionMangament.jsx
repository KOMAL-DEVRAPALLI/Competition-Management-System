import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    getCompetitionById,
    setCompetitionFormat,
} from "../../api/axios.js";

import "./CompetitionManagement.css";


const CompetitionManagement = () => {

    const {
        competitionId,
    } = useParams();


    const navigate =
        useNavigate();


    // =====================================
    // COMPETITION
    // =====================================

    const [
        competition,
        setCompetition,
    ] = useState(null);


    // =====================================
    // FORMAT
    // =====================================

    const [
        competitionFormat,
        setCompetitionFormatState,
    ] = useState("");


    // =====================================
    // LOADING
    // =====================================

    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        savingFormat,
        setSavingFormat,
    ] = useState(false);


    // =====================================
    // MESSAGES
    // =====================================

    const [
        error,
        setError,
    ] = useState("");


    const [
        success,
        setSuccess,
    ] = useState("");


    // =====================================
    // LOAD COMPETITION
    // =====================================

    useEffect(() => {

        let mounted = true;


        const loadCompetition = async () => {

            if (!competitionId) {

                if (mounted) {

                    setError(
                        "Competition ID is missing."
                    );

                    setLoading(false);

                }

                return;
            }


            try {

                setLoading(true);

                setError("");


                const response =
                    await getCompetitionById(
                        competitionId
                    );


                const competitionData =
                    response?.data ??
                    null;


                if (!competitionData) {

                    throw new Error(
                        "Competition data could not be loaded."
                    );

                }


                if (mounted) {

                    setCompetition(
                        competitionData
                    );


                    setCompetitionFormatState(
                        competitionData.competitionFormat ??
                        ""
                    );

                }


            } catch (requestError) {

                console.error(
                    "Load competition error:",
                    requestError
                );


                if (mounted) {

                    setError(

                        requestError.response
                            ?.data
                            ?.message ||

                        requestError.message ||

                        "Unable to load competition."

                    );

                }


            } finally {

                if (mounted) {

                    setLoading(false);

                }

            }

        };


        loadCompetition();


        return () => {

            mounted = false;

        };

    }, [competitionId]);


    // =====================================
    // FORMAT CHANGE
    // =====================================

    const handleFormatChange = (
        event
    ) => {

        setCompetitionFormatState(
            event.target.value
        );

        setError("");

        setSuccess("");

    };


    // =====================================
    // SAVE FORMAT
    // =====================================

    const handleSaveFormat =
        async () => {

            if (savingFormat) {

                return;

            }


            if (!competitionFormat) {

                setError(
                    "Please select a competition format."
                );

                setSuccess("");

                return;

            }


            try {

                setSavingFormat(true);

                setError("");

                setSuccess("");


                const response =
                    await setCompetitionFormat(

                        competitionId,

                        competitionFormat

                    );


                const updatedCompetition =
                    response?.data?.competitionId
                        ? {
                            ...competition,
                            competitionFormat:
                                response.data
                                    .competitionFormat,
                        }
                        : {
                            ...competition,
                            competitionFormat,
                        };


                setCompetition(
                    updatedCompetition
                );


                setCompetitionFormatState(
                    updatedCompetition
                        .competitionFormat ??
                    competitionFormat
                );


                setSuccess(
                    response?.message ||
                    "Competition format saved successfully."
                );


            } catch (requestError) {

                console.error(
                    "Set competition format error:",
                    requestError
                );


                setError(

                    requestError.response
                        ?.data
                        ?.message ||

                    requestError.message ||

                    "Unable to save competition format."

                );


            } finally {

                setSavingFormat(false);

            }

        };


    // =====================================
    // NAVIGATION
    // =====================================

    const handleMenSession = () => {

        navigate(
            `/admin/competition/${competitionId}/athletes/male`
        );

    };


    const handleWomenSession = () => {

        navigate(
            `/admin/competition/${competitionId}/athletes/female`
        );

    };


    // =====================================
    // RENDER
    // =====================================

    return (

        <div className="competition-management-page">


            {/* =================================
                HEADER
            ================================= */}

            <div className="competition-management-header">

                <h1>
                    Competition Management
                </h1>

                <p>
                    Configure the competition before
                    managing athlete sessions.
                </p>

            </div>


            {/* =================================
                GLOBAL ERROR
            ================================= */}

            {error && (

                <div className="competition-management-message error">

                    {error}

                </div>

            )}


            {success && (

                <div className="competition-management-message success">

                    {success}

                </div>

            )}


            {/* =================================
                COMPETITION FORMAT
            ================================= */}

            <section className="competition-format-section">

                <div className="competition-format-header">

                    <div>

                        <h2>
                            Competition Format
                        </h2>

                        <p>
                            Select the competition format used
                            to determine Snatch and Clean &amp; Jerk
                            eligibility.
                        </p>

                    </div>

                </div>


                {loading ? (

                    <div className="competition-format-loading">

                        Loading competition format...

                    </div>

                ) : (

                    <div className="competition-format-content">


                        <div className="competition-format-field">

                            <label htmlFor="competition-format">

                                Competition Format

                            </label>


                            <select
                                id="competition-format"
                                value={
                                    competitionFormat
                                }
                                onChange={
                                    handleFormatChange
                                }
                                disabled={
                                    savingFormat
                                }
                            >

                                <option value="">

                                    Select competition format

                                </option>


                                <option value="TOTAL_ONLY">

                                    Total Only

                                </option>


                                <option value="SEPARATE_LIFT_CLASSIFICATION">

                                    Separate Lift Classification

                                </option>

                            </select>

                        </div>


                        <div className="competition-format-description">

                            {competitionFormat ===
                                "TOTAL_ONLY" && (

                                <p>

                                    <strong>
                                        Total Only:
                                    </strong>{" "}

                                    An athlete who fails all three
                                    Snatch attempts is not eligible
                                    to continue to Clean &amp; Jerk.

                                </p>

                            )}


                            {competitionFormat ===
                                "SEPARATE_LIFT_CLASSIFICATION" && (

                                <p>

                                    <strong>
                                        Separate Lift Classification:
                                    </strong>{" "}

                                    Three failed Snatch attempts do
                                    not by themselves determine
                                    Clean &amp; Jerk eligibility.

                                </p>

                            )}


                            {!competitionFormat && (

                                <p>

                                    A competition format must be
                                    established before the live
                                    competition can use the
                                    format-dependent rules.

                                </p>

                            )}

                        </div>


                        <div className="competition-format-actions">

                            <button
                                type="button"
                                className="competition-format-save-btn"
                                onClick={
                                    handleSaveFormat
                                }
                                disabled={
                                    savingFormat ||
                                    !competitionFormat
                                }
                            >

                                {savingFormat
                                    ? "Saving..."
                                    : "Save Competition Format"}

                            </button>

                        </div>

                    </div>

                )}

            </section>


            {/* =================================
                SESSION MANAGEMENT
            ================================= */}

            <section className="competition-sessions-section">

                <div className="competition-sessions-header">

                    <h2>
                        Athlete Sessions
                    </h2>

                    <p>
                        Select the session you want to manage.
                    </p>

                </div>


                <div className="competition-management-actions">


                    {/* MEN */}

                    <button
                        type="button"
                        onClick={
                            handleMenSession
                        }
                    >

                        Men's Session

                    </button>


                    {/* WOMEN */}

                    <button
                        type="button"
                        onClick={
                            handleWomenSession
                        }
                    >

                        Women's Session

                    </button>


                </div>

            </section>

        </div>

    );

};


export default CompetitionManagement;