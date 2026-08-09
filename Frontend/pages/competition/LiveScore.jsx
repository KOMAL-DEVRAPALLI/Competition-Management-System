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

    // -------------------------------------
    // Current athlete declaration
    // -------------------------------------

    const [declaredWeight, setDeclaredWeight] =
        useState("");

    // -------------------------------------
    // Lift processing
    // -------------------------------------

    const [processingLift, setProcessingLift] =
        useState(false);

    // -------------------------------------
    // Current athlete declaration saving
    // -------------------------------------

    const [savingDeclaration, setSavingDeclaration] =
        useState(false);

    // -------------------------------------
    // Future / queue athlete declaration
    //
    // Stores entryId of the athlete whose
    // declaration is currently being edited.
    // -------------------------------------

    const [
        savingDeclarationEntryId,
        setSavingDeclarationEntryId,
    ] = useState(null);

    // -------------------------------------
    // Athlete selection
    // -------------------------------------

    const [selectingAthlete, setSelectingAthlete] =
        useState(false);

    // -------------------------------------
    // Competition start
    // -------------------------------------

    const [startingCompetition, setStartingCompetition] =
        useState(false);

    // -------------------------------------
    // Messages
    // -------------------------------------

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
    // This remains completely manual.
    //
    // The system does NOT automatically
    // select another athlete.
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
    // SYNC CURRENT ATHLETE DECLARATION
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

    const handleSelectAthlete =
        async (athlete) => {

        if (
            !athlete ||
            selectingAthlete
        ) {

            return;

        }


        // =================================
        // DO NOT CHANGE CURRENT ATHLETE
        // =================================

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


            console.time(
                "SELECT ATHLETE - POST"
            );


            const response =
                await apiRequest(
                    SELECT_ATHLETE_URL,
                    "POST",
                    {
                        competitionId,
                        gender,
                        entryId:
                            athlete.entryId,
                    }
                );


            console.timeEnd(
                "SELECT ATHLETE - POST"
            );


            console.log(
                "SELECT ATHLETE RESPONSE:",
                response.data
            );


            setLiftMessage(
                `${athlete.name} selected.`
            );


            // =================================
            // GET ONLY AFTER ATHLETE SELECTION
            //
            // Selection changes platform state,
            // so refreshing the live state is
            // appropriate here.
            // =================================

            console.time(
                "SELECT ATHLETE - GET"
            );


            await loadLiveCompetition();


            console.timeEnd(
                "SELECT ATHLETE - GET"
            );


        } catch (error) {

            console.error(
                "Failed to select athlete:",
                error
            );


            setLiftError(
                error.response
                    ?.data
                    ?.message ||
                error.message ||
                "Failed to select athlete."
            );

        } finally {

            setSelectingAthlete(false);

        }
    };


    // =====================================
    // SAVE CURRENT ATHLETE DECLARATION
    //
    // This is the declaration from the
    // CurrentAthletePanel.
    //
    // It does NOT select an athlete.
    // It does NOT process a lift.
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


            // =================================
            // UPDATE CURRENT ATHLETE LOCALLY
            //
            // No extra GET required.
            // =================================

            setLiveCompetition(
                (previous) => {

                    if (!previous) {

                        return previous;

                    }


                    const updateAttempt =
                        (athlete) => {

                        if (
                            !athlete ||
                            athlete.entryId
                                ?.toString() !==
                            currentAthlete.entryId
                                ?.toString()
                        ) {

                            return athlete;

                        }


                        return {

                            ...athlete,

                            currentAttempt: {

                                ...athlete.currentAttempt,

                                declaredWeight:
                                    weight,

                                declaredAt:
                                    new Date().toISOString(),

                            },

                        };

                    };


                    return {

                        ...previous,

                        currentAthlete:
                            updateAttempt(
                                previous.currentAthlete
                            ),

                        athletes:
                            previous.athletes?.map(
                                updateAttempt
                            ),

                        competitionResults:
                            previous
                                .competitionResults
                                ?.map(
                                    updateAttempt
                                ),

                    };

                }
            );


            setLiftMessage(
                "Declaration saved successfully."
            );


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
    // EDIT ANY ATHLETE DECLARATION
    //
    // IMPORTANT:
    //
    // This is NOT athlete selection.
    //
    // Official can edit another athlete's
    // pending declaration while somebody
    // else is currently on the platform.
    //
    // Example:
    //
    // Current athlete = A
    // Future athlete  = E
    //
    // E: 60 -> 65
    //
    // A remains current.
    //
    // NO GOOD / NO LIFT is required.
    // =====================================

    const handleEditDeclaration =
        async ({
            entryId,
            declaredWeight: newDeclaredWeight,
        }) => {

        if (
            !entryId ||
            savingDeclarationEntryId
        ) {

            return;

        }


        // =================================
        // FIND ATHLETE
        // =================================

        const athlete =
            athletes.find(
                (item) =>
                    item.entryId
                        ?.toString() ===
                    entryId
                        ?.toString()
            );


        if (!athlete) {

            setLiftError(
                "Athlete not found."
            );

            return;

        }


        // =================================
        // FIND PENDING ATTEMPT
        // =================================

        const attempt =
            athlete.currentAttempt;


        if (!attempt) {

            setLiftError(
                "This athlete does not have a pending attempt."
            );

            return;

        }


        // =================================
        // COMPLETED ATHLETE
        // =================================

        if (
            attempt.completed ||
            athlete.status === "COMPLETED"
        ) {

            setLiftError(
                "This athlete has completed the competition."
            );

            return;

        }


        // =================================
        // PHASE CHECK
        //
        // A future athlete can only have
        // their declaration changed for the
        // currently active phase.
        //
        // Example:
        //
        // SNATCH phase
        // E's SNATCH declaration → allowed
        //
        // SNATCH phase
        // E's C&J declaration → blocked
        // =================================

        if (
            attempt.phase !== currentPhase
        ) {

            setLiftError(
                `${attempt.phase === "SNATCH"
                    ? "Snatch"
                    : "Clean & Jerk"
                } declaration cannot be changed while the competition is in the ${
                    currentPhase === "SNATCH"
                        ? "Snatch"
                        : "Clean & Jerk"
                } phase.`
            );

            return;

        }


        // =================================
        // ATTEMPT ALREADY COMPLETED
        // =================================

        if (
            attempt.result &&
            attempt.result !== "PENDING"
        ) {

            setLiftError(
                "This attempt has already been completed."
            );

            return;

        }


        // =================================
        // VALIDATE WEIGHT
        // =================================

        const weight =
            Number(
                newDeclaredWeight
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

            setSavingDeclarationEntryId(
                entryId
            );

            setLiftError("");
            setLiftMessage("");


            // =================================
            // SAME DECLARATION API
            //
            // No new endpoint.
            // =================================

            await saveDeclaredWeight({

                entryId,

                declaredWeight:
                    weight,

            });


            // =================================
            // UPDATE ONLY THIS ATHLETE LOCALLY
            //
            // NO GET REQUEST.
            //
            // CURRENT ATHLETE IS NOT CHANGED.
            // =================================

            setLiveCompetition(
                (previous) => {

                    if (!previous) {

                        return previous;

                    }


                    const updateAthlete =
                        (athleteItem) => {

                        if (
                            !athleteItem ||
                            athleteItem.entryId
                                ?.toString() !==
                            entryId
                                ?.toString()
                        ) {

                            return athleteItem;

                        }


                        const updatedAttempt = {

                            ...athleteItem.currentAttempt,

                            declaredWeight:
                                weight,

                            declaredAt:
                                new Date().toISOString(),

                        };


                        return {

                            ...athleteItem,

                            currentAttempt:
                                updatedAttempt,

                        };

                    };


                    return {

                        ...previous,

                        // ---------------------------------
                        // CURRENT ATHLETE
                        //
                        // If E is edited, A remains A.
                        // ---------------------------------

                        currentAthlete:
                            previous.currentAthlete,

                        // ---------------------------------
                        // OFFICIAL ATHLETE LIST
                        // ---------------------------------

                        athletes:
                            previous.athletes?.map(
                                updateAthlete
                            ),

                        // ---------------------------------
                        // TV RESULT LIST
                        // ---------------------------------

                        competitionResults:
                            previous
                                .competitionResults
                                ?.map(
                                    updateAthlete
                                ),

                    };

                }
            );


            setLiftMessage(
                `${athlete.name}'s declaration updated to ${weight} kg.`
            );


        } catch (error) {

            console.error(
                "Failed to update athlete declaration:",
                error
            );


            setLiftError(
                error.response
                    ?.data
                    ?.message ||
                error.message ||
                "Failed to update declaration."
            );

        } finally {

            setSavingDeclarationEntryId(null);

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


            // =================================
            // PROCESS LIFT
            //
            // Backend returns updated athlete
            // and live session.
            // =================================

            const response =
                await processLift({

                    entryId:
                        currentAthlete.entryId,

                    competitionId,

                    gender,

                    result,

                });


            const data =
                response?.data;


            // =================================
            // SAFETY CHECK
            // =================================

            if (
                !data ||
                !data.athlete
            ) {

                throw new Error(
                    "Live scoring response is incomplete."
                );

            }


            const updatedEntry =
                data.athlete;


            const nextAttempt =
                data.nextAttempt ??
                null;


            // =================================
            // UPDATE CURRENT ATHLETE LOCALLY
            //
            // NO SECOND GET.
            // =================================

            const updatedCurrentAthlete = {

                ...currentAthlete,


                // ---------------------------------
                // ATTEMPT DATA
                // ---------------------------------

                snatchAttempts:
                    updatedEntry.snatchAttempts ??
                    currentAthlete.snatchAttempts,

                cleanJerkAttempts:
                    updatedEntry.cleanJerkAttempts ??
                    currentAthlete.cleanJerkAttempts,


                // ---------------------------------
                // RESULTS
                // ---------------------------------

                bestSnatch:
                    updatedEntry.results
                        ?.bestSnatch ??
                    currentAthlete.bestSnatch,

                bestCleanJerk:
                    updatedEntry.results
                        ?.bestCleanJerk ??
                    currentAthlete.bestCleanJerk,

                total:
                    updatedEntry.results
                        ?.total ??
                    currentAthlete.total,

                place:
                    updatedEntry.results
                        ?.rank ??
                    currentAthlete.place,


                // ---------------------------------
                // NEXT ATTEMPT
                // ---------------------------------

                currentAttempt:
                    nextAttempt,

            };


            // =====================================
            // UPDATE CURRENT ATHLETE IN LIST
            // =====================================

            const updatedAthletes =
                athletes.map(
                    (athlete) => {

                        if (
                            athlete.entryId
                                ?.toString() ===
                            currentAthlete.entryId
                                ?.toString()
                        ) {

                            return {

                                ...athlete,

                                ...updatedCurrentAthlete,

                            };

                        }


                        return athlete;

                    }
                );


            // =====================================
            // UPDATE TV RESULT LIST
            // =====================================

            const updatedCompetitionResults =
                competitionResults.map(
                    (athlete) => {

                        if (
                            athlete.entryId
                                ?.toString() ===
                            currentAthlete.entryId
                                ?.toString()
                        ) {

                            return {

                                ...athlete,

                                ...updatedCurrentAthlete,

                            };

                        }


                        return athlete;

                    }
                );


            // =====================================
            // DETERMINE WHETHER ANOTHER ATHLETE
            // CAN BE SELECTED
            // =====================================

            let updatedCanSelect =
                false;


            if (
                data.manualSelectionRequired
            ) {

                updatedCanSelect =
                    true;

            }
            else if (
                nextAttempt &&
                nextAttempt.declaredWeight != null &&
                Number(
                    nextAttempt.declaredWeight
                ) > 0
            ) {

                updatedCanSelect =
                    true;

            }


            // =====================================
            // UPDATE LIVE COMPETITION STATE
            //
            // ONE React state update.
            //
            // NO SECOND GET.
            // =====================================

            setLiveCompetition(
                (previous) => ({

                    ...previous,

                    currentAthlete:
                        updatedCurrentAthlete,

                    athletes:
                        updatedAthletes,

                    competitionResults:
                        updatedCompetitionResults,

                    canSelectAnotherAthlete:
                        updatedCanSelect,

                    currentPhase:
                        data.session
                            ?.currentPhase ??
                        previous.currentPhase,

                    status:
                        data.session
                            ?.status ??
                        previous.status,

                })
            );


            // =====================================
            // CLEAR DECLARATION INPUT
            // =====================================

            setDeclaredWeight("");


            // =====================================
            // SUCCESS MESSAGE
            // =====================================

            setLiftMessage(
                result === "GOOD"
                    ? "Good Lift saved successfully."
                    : "No Lift saved successfully."
            );


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
        startingCompetition ||
        savingDeclarationEntryId;


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
                        savingDeclarationEntryId &&
                        "Updating athlete declaration..."}


                    {!startingCompetition &&
                        !selectingAthlete &&
                        !savingDeclaration &&
                        !processingLift &&
                        !savingDeclarationEntryId &&
                        liftMessage &&
                        `✓ ${liftMessage}`}


                    {!startingCompetition &&
                        !selectingAthlete &&
                        !savingDeclaration &&
                        !savingDeclarationEntryId &&
                        processingLift &&
                        "Saving lift result..."}


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

                        {
                            startingCompetition
                                ? "Starting..."
                                : "Start Competition"
                        }

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

                // IMPORTANT:
                // CurrentAthletePanel uses this
                // to lock C&J declaration while
                // competition is still in Snatch.

                currentPhase={
                    currentPhase
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

                // =================================
                // NEW:
                //
                // Allows official to edit the
                // pending declaration of ANY
                // athlete in the table.
                //
                // This does NOT select the athlete.
                // =================================

                onEditDeclaration={
                    handleEditDeclaration
                }

                savingDeclarationEntryId={
                    savingDeclarationEntryId
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