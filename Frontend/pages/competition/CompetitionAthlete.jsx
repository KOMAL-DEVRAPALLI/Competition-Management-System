import {
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    apiRequest,
} from "../../api/axios.js";

import useCompetitionEntries
    from "../../hooks/useCompetitionEntries.js";

import AthleteTable
    from "../../components/Admin/AthleteTable.jsx";

import FilterBar
    from "../../components/Admin/FilterBar.jsx";

import useCompetition
    from "../../hooks/useCompetition.js";

import StartCompetitionModal
    from "../../components/Admin/Competition/StartCompetitionModal.jsx";

import "./CompetitionAthlete.css";


const CompetitionAthleteList = () => {

    // =====================================
    // ROUTER
    // =====================================

    const {
        competitionId,
        gender: sessionGender,
    } = useParams();


    const navigate =
        useNavigate();


    // =====================================
    // COMPETITION DATA
    // =====================================

    const {
        entries,
        loading,
    } =
        useCompetitionEntries(
            competitionId
        );


    const {
        competition,
        loading: competitionLoading,
    } =
        useCompetition(
            competitionId
        );


    // =====================================
    // FILTER STATE
    // =====================================

    const [
        category,
        setCategory,
    ] = useState("");


    const [
        status,
        setStatus,
    ] = useState("");


    // =====================================
    // START COMPETITION STATE
    // =====================================

    const [
        showStartModal,
        setShowStartModal,
    ] = useState(false);


    const [
        sessionName,
        setSessionName,
    ] = useState("");


    const [
        selectedWeightCategories,
        setSelectedWeightCategories,
    ] = useState([]);


    // =====================================
    // FILTER ENTRIES
    //
    // NO SEARCH
    //
    // Athletes are filtered only by:
    // - U17 / U19
    // - status
    // - current session gender
    // =====================================

    const filteredEntries =
        entries.filter((entry) => {

            const athleteGender =
                entry.athleteId
                    ?.personalInfo
                    ?.gender
                    ?.trim()
                    .toLowerCase() || "";


            const entryAgeCategory =
                entry.competitionCategory
                    ?.ageCategory
                    ?.trim()
                    .toUpperCase() || "";


            // ---------------------------------
            // AGE CATEGORY
            // ---------------------------------

            const categoryMatch =
                !category ||
                entryAgeCategory ===
                    category
                        .trim()
                        .toUpperCase();


            // ---------------------------------
            // STATUS
            // ---------------------------------

            const statusMatch =
                !status ||
                entry.status === status;


            // ---------------------------------
            // SESSION GENDER
            // ---------------------------------

            const genderMatch =
                !sessionGender ||
                athleteGender ===
                    sessionGender
                        .trim()
                        .toLowerCase();


            return (
                categoryMatch &&
                statusMatch &&
                genderMatch
            );

        });


    // =====================================
    // GROUP ATHLETES
    //
    // One athlete may have one or more
    // competition entries.
    // =====================================

    const groupedEntries =
        Object.values(

            filteredEntries.reduce(
                (
                    accumulator,
                    entry
                ) => {

                    const athlete =
                        entry.athleteId;


                    if (!athlete?._id) {

                        return accumulator;

                    }


                    const athleteId =
                        athlete._id;


                    if (
                        !accumulator[athleteId]
                    ) {

                        accumulator[
                            athleteId
                        ] = {

                            athleteId:
                                athlete,

                            competitionEntries:
                                [],

                        };

                    }


                    accumulator[
                        athleteId
                    ]
                        .competitionEntries
                        .push(
                            entry
                        );


                    return accumulator;

                },
                {}
            )

        );


    // =====================================
    // AVAILABLE WEIGHT CATEGORIES
    // =====================================

    const availableWeightCategories = [

        ...new Set(

            (
                competition
                    ?.weightCategories ??
                []
            )

                .filter(
                    (item) =>
                        item.gender
                            ?.toLowerCase() ===
                        sessionGender
                            ?.toLowerCase()
                )

                .flatMap(
                    (item) =>
                        item.weights ?? []
                )

        ),

    ].sort((a, b) => {

        const aValue =
            String(a)
                .startsWith("+")
                ? Number.MAX_SAFE_INTEGER
                : parseFloat(a);


        const bValue =
            String(b)
                .startsWith("+")
                ? Number.MAX_SAFE_INTEGER
                : parseFloat(b);


        return aValue - bValue;

    });


    // =====================================
    // AVAILABLE AGE CATEGORIES
    //
    // SCHOOL GAMES:
    //
    // U17 / U19
    // =====================================

    const availableAgeCategories = [

        "U17",
        "U19",

    ].filter(

        (ageCategory) =>
            competition
                ?.eligibilityRules
                ?.[
                    ageCategory.toLowerCase()
                ]

    );


    // =====================================
    // LOADING
    // =====================================

    if (
        loading ||
        competitionLoading
    ) {

        return (

            <div className="container mt-5 text-center">

                <h1>

                    {
                        sessionGender
                            ?.toLowerCase() ===
                        "female"

                            ? "Women's Session"

                            : "Men's Session"
                    }

                </h1>

            </div>

        );

    }


    // =====================================
    // PREPARE COMPETITION
    // =====================================

    const prepareCompetition =
        async () => {

            try {

                const response =
                    await apiRequest(

                        `/competition-entry/prepare/${competitionId}`,

                        "POST"

                    );


                alert(
                    response.message
                );


                window.location.reload();

            } catch (error) {

                console.error(
                    "Prepare competition error:",
                    error
                );


                alert(
                    error.response
                        ?.data
                        ?.message ||

                    error.message ||

                    "Unable to prepare competition."
                );

            }

        };


    // =====================================
    // START COMPETITION
    // =====================================

    const handleStartCompetition =
        async () => {

            try {

                await apiRequest(

                    `/live-competition/start/${competitionId}/${sessionGender}`,

                    "POST",

                    {
                        sessionName,

                        selectedWeightCategories,
                    }

                );


                setShowStartModal(
                    false
                );


                navigate(

                    `/admin/live-score/${competitionId}/${sessionGender}`

                );

            } catch (error) {

                console.error(
                    "Start competition error:",
                    error
                );


                alert(

                    error.response
                        ?.data
                        ?.message ||

                    error.message ||

                    "Unable to start competition."

                );

            }

        };


    // =====================================
    // ADD NEW ATHLETE
    // =====================================

    const handleAddAthlete =
        () => {

            navigate(

                `/admin/competition/${competitionId}/athletes/${sessionGender}/add`

            );

        };


    // =====================================
    // RENDER
    // =====================================

    return (

        <div className="competition-athlete-page">


            {/* =================================
                HEADER
            ================================= */}

            <div className="competition-athlete-header">


                {/* =================================
                    TITLE
                ================================= */}

                <div>

                    <h1 className="page-title">

                        {
                            sessionGender
                                ?.toLowerCase() ===
                            "female"

                                ? "Women's Competition Athletes"

                                : "Men's Competition Athletes"
                        }

                    </h1>


                    <p className="page-subtitle">

                        Competition ID :{" "}
                        {competitionId}

                    </p>

                </div>


                {/* =================================
                    ACTION BUTTONS
                ================================= */}

                <div className="header-actions">


                    {/* ADD NEW ATHLETE */}

                    <button

                        className="add-athlete-btn"

                        onClick={
                            handleAddAthlete
                        }

                    >

                        + Add New Athlete

                    </button>


                    {/* PREPARE COMPETITION */}

                    <button

                        className="prepare-btn"

                        onClick={
                            prepareCompetition
                        }

                    >

                        Prepare Competition

                    </button>


                    {/* START LIST */}

                    <button

                        className="start-list-btn"

                        onClick={() =>
                            navigate(

                                `/admin/competition/${competitionId}/start-list/${sessionGender}`,

                                {
                                    state: {
                                        refresh: true,
                                    },
                                }

                            )
                        }

                    >

                        View Start List

                    </button>


                    {/* OFFICIAL SCREEN */}

                    <button

                        className="live-btn"

                        onClick={() =>
                            navigate(

                                `/admin/live-score/${competitionId}/${sessionGender}`

                            )
                        }

                    >

                        Official Screen

                    </button>


                    {/* START COMPETITION */}

                    <button

                        className="pdf-btn"

                        onClick={() =>
                            setShowStartModal(
                                true
                            )
                        }

                    >

                        Start Competition

                    </button>


                    {/* PUBLIC SCOREBOARD */}

                    <button

                        className="scoreboard-btn"

                        onClick={() =>
                            window.open(

                                `/admin/score-board/${competitionId}/${sessionGender}`,

                                "_blank"

                            )
                        }

                    >

                        Live Scoreboard

                    </button>


                </div>

            </div>


            {/* =================================
                FILTERS
            ================================= */}

            <FilterBar

                category={
                    category
                }

                status={
                    status
                }

                onCategoryChange={
                    setCategory
                }

                onStatusChange={
                    setStatus
                }

                onReset={() => {

                    setCategory("");

                    setStatus("");

                }}

                ageCategories={
                    availableAgeCategories
                }

            />


            {/* =================================
                ATHLETE CONTENT
            ================================= */}

            <div className="competition-athlete-content">


                {filteredEntries.length === 0 ? (

                    <div className="empty-state">

                        No athletes found for this competition.

                    </div>

                ) : (

                    <AthleteTable

                        entries={
                            groupedEntries
                        }

                    />

                )}

            </div>


            {/* =================================
                START COMPETITION MODAL
            ================================= */}

            <StartCompetitionModal

                open={
                    showStartModal
                }

                sessionName={
                    sessionName
                }

                setSessionName={
                    setSessionName
                }

                availableWeightCategories={
                    availableWeightCategories
                }

                selectedWeightCategories={
                    selectedWeightCategories
                }

                setSelectedWeightCategories={
                    setSelectedWeightCategories
                }

                onClose={() =>
                    setShowStartModal(
                        false
                    )
                }

                onStart={
                    handleStartCompetition
                }

            />

        </div>

    );

};


export default CompetitionAthleteList;