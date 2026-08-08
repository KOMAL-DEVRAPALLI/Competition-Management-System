import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
    apiRequest,
    processLift,
    saveDeclaredWeight,
} from "../../api/axios";

import "./LiveScore.css";

import LiveScoreHeader from "./components/LiveScoreHeader";
import CurrentAthletePanel from "./components/CurrentAthletePanel";
import AthleteSelectionTable from "./components/AthleteSelectionTable";
import CompetitionResults from "./components/CompetitionResults";

const LiveScore = () => {

    const {
        competitionId,
        gender,
    } = useParams();

    // =====================================
    // API
    // =====================================

    const SELECT_ATHLETE_URL =
        "/live-competition/select-official-athlete";


    // =====================================
    // STATE
    // =====================================

    const [loading, setLoading] =
        useState(true);

    const [liveCompetition, setLiveCompetition] =
        useState(null);

    const [declaredWeight, setDeclaredWeight] =
        useState("");

    const [processingLift, setProcessingLift] =
        useState(false);

    const [savingDeclaration, setSavingDeclaration] =
        useState(false);

    const [selectingAthlete, setSelectingAthlete] =
        useState(false);

    const [startingCompetition, setStartingCompetition] =
        useState(false);

    const [liftMessage, setLiftMessage] =
        useState("");

    const [liftError, setLiftError] =
        useState("");


    // =====================================
    // LIVE DATA
    // =====================================

    const {
        currentAthlete = null,
        athletes = [],
        competitionResults = [],
        status = "READY",
        currentPhase = "SNATCH",
        totalAthletes = 0,
    } = liveCompetition || {};


    // =====================================
    // CURRENT ATTEMPT
    // =====================================

    const currentAttempt =
        currentAthlete?.currentAttempt ?? null;


    // =====================================
    // CAN SELECT ANOTHER ATHLETE
    //
    // IMPORTANT:
    //
    // The current athlete remains selected
    // after GOOD / NO_LIFT.
    //
    // Another athlete becomes selectable
    // only after the current athlete's
    // next attempt has been declared.
    // =====================================

    const canSelectAnotherAthlete =
        !currentAthlete ||
        (
            currentAttempt &&
            currentAttempt.declaredWeight != null &&
            Number(
                currentAttempt.declaredWeight
            ) > 0
        );


    // =====================================
    // LOAD LIVE COMPETITION
    // =====================================

    const loadLiveCompetition = async () => {

        try {

            const response =
                await apiRequest(
                    `/live-competition/${competitionId}/${gender}`,
                    "GET"
                );

            setLiveCompetition(
                response.data
            );

            return response.data;

        } catch (error) {

            console.error(
                "Failed to load live competition:",
                error
            );

            console.log(
                "Backend Response:",
                error.response?.data
            );

            setLiftError(
                error.response
                    ?.data
                    ?.message ||
                error.message ||
                "Failed to load live competition."
            );

        } finally {

            setLoading(false);

        }
    };


    // =====================================
    // INITIAL LOAD
    // =====================================

    useEffect(() => {

        loadLiveCompetition();

    }, [competitionId, gender]);


    // =====================================
    // SYNC DECLARATION INPUT
    // =====================================

    useEffect(() => {

        if (!currentAthlete) {

            setDeclaredWeight("");

            return;
        }


        const attempt =
            currentAthlete.currentAttempt;


        if (!attempt) {

            setDeclaredWeight("");

            return;
        }


        // =================================
        // EXISTING DECLARATION
        // =================================

        if (
            attempt.declaredWeight != null &&
            Number(
                attempt.declaredWeight
            ) > 0
        ) {

            setDeclaredWeight(
                attempt.declaredWeight
            );

            return;
        }


        // =================================
        // ATTEMPT 1
        // =================================

        if (
            attempt.attemptNo === 1
        ) {

            const openingWeight =
                attempt.phase === "SNATCH"
                    ? currentAthlete.openingSnatch
                    : currentAthlete.openingCleanJerk;


            setDeclaredWeight(
                openingWeight ?? ""
            );

            return;
        }


        // =================================
        // ATTEMPT 2 / 3
        // =================================

        setDeclaredWeight("");

    }, [currentAthlete]);


    // =====================================
    // START COMPETITION
    //
    // ONLY CREATES THE SESSION.
    //
    // DOES NOT SELECT ATHLETE.
    // =====================================

    const handleStartCompetition =
        async () => {

        if (startingCompetition) {
            return;
        }


        try {

            setStartingCompetition(true);

            setLiftError("");
            setLiftMessage("");


            await apiRequest(
                `/live-competition/start/${competitionId}/${gender}`,
                "POST",
                {
                    sessionName: "",
                    selectedWeightCategories: [],
                }
            );


            setLiftMessage(
                "Live competition started. Official must select the athlete."
            );


            await loadLiveCompetition();

        } catch (error) {

            console.error(
                "Failed to start competition:",
                error
            );


            setLiftError(
                error.response
                    ?.data
                    ?.message ||
                error.message ||
                "Failed to start competition."
            );

        } finally {

            setStartingCompetition(false);

        }
    };


    // =====================================
    // SELECT ATHLETE
    //
    // OFFICIAL MANUALLY CHOOSES ATHLETE.
    //
    // NO AUTOMATIC ORDERING.
    // =====================================

   const handleSelectAthlete = async (athlete) => {

    if (!athlete || selectingAthlete) {
        return;
    }

    if (currentAthlete) {
        setLiftError(
            "Declare the current athlete's next attempt before selecting another athlete."
        );
        return;
    }

    try {

        setSelectingAthlete(true);
        setLiftError("");
        setLiftMessage("");

        console.time("SELECT ATHLETE - POST");

        const response = await apiRequest(
            SELECT_ATHLETE_URL,
            "POST",
            {
                competitionId,
                gender,
                entryId: athlete.entryId,
            }
        );

        console.timeEnd("SELECT ATHLETE - POST");

        console.log(
            "SELECT ATHLETE RESPONSE:",
            response.data
        );

        setLiftMessage(
            `${athlete.name} selected.`
        );

        console.time("SELECT ATHLETE - GET");

        await loadLiveCompetition();

        console.timeEnd("SELECT ATHLETE - GET");

    } catch (error) {

        console.error(
            "Failed to select athlete:",
            error
        );

        setLiftError(
            error.response?.data?.message ||
            error.message ||
            "Failed to select athlete."
        );

    } finally {

        setSelectingAthlete(false);

    }
};


    // =====================================
    // SAVE DECLARATION
    //
    // DECLARATION ONLY.
    //
    // DOES NOT SELECT ATHLETE.
    // =====================================

    const handleSaveDeclaration =
        async () => {

        if (
            !currentAthlete ||
            savingDeclaration
        ) {
            return;
        }


        const weight =
            Number(
                declaredWeight
            );


        if (
            Number.isNaN(weight) ||
            weight <= 0
        ) {

            setLiftError(
                "Please enter a valid declared weight."
            );

            return;
        }


        try {

            setSavingDeclaration(true);

            setLiftError("");
            setLiftMessage("");


            await saveDeclaredWeight({

                entryId:
                    currentAthlete.entryId,

                declaredWeight:
                    weight,

            });


            setLiftMessage(
                "Declaration saved successfully."
            );


            await loadLiveCompetition();

        } catch (error) {

            console.error(
                "Failed to save declaration:",
                error
            );


            setLiftError(
                error.response
                    ?.data
                    ?.message ||
                error.message ||
                "Failed to save declaration."
            );

        } finally {

            setSavingDeclaration(false);

        }
    };


    // =====================================
    // PROCESS LIFT
    //
    // GOOD / NO LIFT
    //
    // CURRENT ATHLETE REMAINS SELECTED.
    //
    // NO AUTOMATIC NEXT ATHLETE.
    // =====================================

    const handleProcessLift =
        async (result) => {

        if (
            !currentAthlete ||
            processingLift
        ) {
            return;
        }


        try {

            setProcessingLift(true);

            setLiftMessage("");
            setLiftError("");


            console.log(
                "===== PROCESS OFFICIAL RESULT ====="
            );

            console.log(
                "Athlete:",
                currentAthlete.name
            );

            console.log(
                "Result:",
                result
            );


            await processLift({

                entryId:
                    currentAthlete.entryId,

                competitionId,

                gender,

                result,

            });


            setLiftMessage(
                result === "GOOD"
                    ? "Good Lift saved successfully."
                    : "No Lift saved successfully."
            );


            setDeclaredWeight("");


            await loadLiveCompetition();

        } catch (error) {

            console.error(
                "Failed to process lift:",
                error
            );


            setLiftError(
                error.response
                    ?.data
                    ?.message ||
                error.message ||
                "Failed to save lift."
            );

        } finally {

            setProcessingLift(false);

        }
    };


    // =====================================
    // LOADING
    // =====================================

    if (loading) {

        return (

            <div className="live-score-page">

                <div className="live-score-loading">

                    <h2>
                        Loading Live Competition...
                    </h2>

                </div>

            </div>

        );
    }


    // =====================================
    // STATUS MESSAGE
    // =====================================

    const showStatus =
        liftMessage ||
        liftError ||
        processingLift ||
        savingDeclaration ||
        selectingAthlete ||
        startingCompetition;


    // =====================================
    // UI
    // =====================================

    return (

        <div className="live-score-page">


            {/* =================================
                HEADER
            ================================= */}

            <LiveScoreHeader

                competitionId={
                    competitionId
                }

                status={
                    status
                }

                currentPhase={
                    currentPhase
                }

                totalAthletes={
                    totalAthletes
                }

            />


            {/* =================================
                STATUS MESSAGE
            ================================= */}

            {showStatus && (

                <div
                    className={
                        liftError
                            ? "lift-status lift-status-error"
                            : "lift-status lift-status-success"
                    }
                >

                    {startingCompetition &&
                        "Starting competition..."}


                    {!startingCompetition &&
                        selectingAthlete &&
                        "Selecting athlete..."}


                    {!startingCompetition &&
                        !selectingAthlete &&
                        savingDeclaration &&
                        "Saving declaration..."}


                    {!startingCompetition &&
                        !selectingAthlete &&
                        !savingDeclaration &&
                        processingLift &&
                        "Saving lift result..."}


                    {!startingCompetition &&
                        !selectingAthlete &&
                        !savingDeclaration &&
                        !processingLift &&
                        liftMessage &&
                        `✓ ${liftMessage}`}


                    {liftError &&
                        `✕ ${liftError}`}

                </div>

            )}


            {/* =================================
                START COMPETITION
            ================================= */}

            {!currentAthlete &&
                status === "READY" && (

                <div className="live-score-start">

                    <button
                        type="button"
                        onClick={
                            handleStartCompetition
                        }
                        disabled={
                            startingCompetition
                        }
                    >

                        {startingCompetition
                            ? "Starting..."
                            : "Start Competition"}

                    </button>

                </div>

            )}


            {/* =================================
                CURRENT ATHLETE
            ================================= */}

            <CurrentAthletePanel

                currentAthlete={
                    currentAthlete
                }

                declaredWeight={
                    declaredWeight
                }

                setDeclaredWeight={
                    setDeclaredWeight
                }

                onSaveDeclaration={
                    handleSaveDeclaration
                }

                onProcessLift={
                    handleProcessLift
                }

                savingDeclaration={
                    savingDeclaration
                }

                processingLift={
                    processingLift
                }

            />


            {/* =================================
                OFFICIAL ATHLETE SELECTION
            ================================= */}

            <AthleteSelectionTable

                athletes={
                    athletes
                }

                currentAthlete={
                    currentAthlete
                }

                currentPhase={
                    currentPhase
                }

                canSelectAnotherAthlete={
                    canSelectAnotherAthlete
                }

                selectingAthlete={
                    selectingAthlete
                }

                onSelectAthlete={
                    handleSelectAthlete
                }

            />


            {/* =================================
                LIVE SCOREBOARD
            ================================= */}

            <CompetitionResults

                competitionResults={
                    competitionResults
                }

                currentAthlete={
                    currentAthlete
                }

            />

        </div>

    );
};


export default LiveScore;