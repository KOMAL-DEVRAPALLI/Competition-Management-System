import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import {
    apiRequest,
    processLift,
    saveDeclaredWeight,
} from "../../api/axios";

import "./LiveScore.css";

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

        // =================================
        // NEW
        //
        // Backend determines whether the
        // official may select another
        // athlete.
        // =================================

        canSelectAnotherAthlete = false,

    } = liveCompetition || {};

    // =====================================
    // LOAD LIVE COMPETITION
    // =====================================

    const loadLiveCompetition = async (
        showLoading = false
    ) => {

        try {

            if (showLoading) {
                setLoading(true);
            }

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

            setLiftError(
                error.response
                    ?.data
                    ?.message ||
                error.message ||
                "Failed to load live competition."
            );

            return null;

        } finally {

            if (showLoading) {
                setLoading(false);
            }

        }
    };

    // =====================================
    // INITIAL LOAD
    // =====================================

    useEffect(() => {

        loadLiveCompetition(true);

    }, [
        competitionId,
        gender,
    ]);

    // =====================================
    // LIVE REFRESH
    //
    // Important for TV scoreboard.
    //
    // This DOES NOT select anyone.
    // It only reads current server state.
    // =====================================

    useEffect(() => {

        const interval =
            setInterval(() => {

                loadLiveCompetition(false);

            }, 1000);

        return () => {

            clearInterval(interval);

        };

    }, [
        competitionId,
        gender,
    ]);

    // =====================================
    // SYNC DECLARATION INPUT
    //
    // IMPORTANT:
    //
    // Do NOT overwrite the input every
    // second.
    //
    // declarationKey identifies the exact
    // athlete + phase + attempt.
    // =====================================

    const currentEntryId =
        currentAthlete?.entryId?.toString() ??
        null;

    const currentAttemptNo =
        currentAthlete
            ?.currentAttempt
            ?.attemptNo ??
        null;

    const currentAttemptPhase =
        currentAthlete
            ?.currentAttempt
            ?.phase ??
        null;

    const declarationKey =
        currentEntryId &&
        currentAttemptNo &&
        currentAttemptPhase
            ? `${currentEntryId}-${currentAttemptPhase}-${currentAttemptNo}`
            : null;

    const lastDeclarationKey =
        useRef(null);

    useEffect(() => {

        // ---------------------------------
        // Platform became empty
        // ---------------------------------

        if (
            !currentAthlete ||
            !declarationKey
        ) {

            if (
                lastDeclarationKey.current !==
                null
            ) {

                lastDeclarationKey.current =
                    null;

                setDeclaredWeight("");

            }

            return;

        }

        // ---------------------------------
        // Same athlete + same attempt
        //
        // NEVER overwrite what the official
        // is typing.
        // ---------------------------------

        if (
            lastDeclarationKey.current ===
            declarationKey
        ) {

            return;

        }

        lastDeclarationKey.current =
            declarationKey;

        const attempt =
            currentAthlete.currentAttempt;

        if (!attempt) {

            setDeclaredWeight("");

            return;

        }

        // ---------------------------------
        // Existing saved declaration
        // ---------------------------------

        if (
            attempt.declaredWeight != null &&
            Number(attempt.declaredWeight) > 0
        ) {

            setDeclaredWeight(
                attempt.declaredWeight
            );

            return;

        }

        // ---------------------------------
        // Attempt 1 uses opening weight
        //
        // IMPORTANT:
        //
        // This is only the INITIAL value.
        // Official can edit it.
        // ---------------------------------

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

        // ---------------------------------
        // Attempt 2 / 3 starts empty
        // ---------------------------------

        setDeclaredWeight("");

    }, [
        declarationKey,
        currentAthlete,
    ]);

    // =====================================
    // START COMPETITION
    //
    // Creates session only.
    //
    // NO ATHLETE IS SELECTED.
    // =====================================

    const handleStartCompetition =
        async () => {

            if (
                startingCompetition
            ) {
                return;
            }

            try {

                setStartingCompetition(
                    true
                );

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

                await loadLiveCompetition(
                    false
                );

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

                setStartingCompetition(
                    false
                );

            }

        };

    // =====================================
    // SELECT ATHLETE
    //
    // OFFICIAL MANUALLY SELECTS.
    //
    // NO AUTOMATIC ORDERING.
    //
    // IMPORTANT:
    //
    // Current athlete may remain selected
    // after GOOD / NO LIFT.
    //
    // Once their next declaration is saved,
    // another athlete may be selected.
    // =====================================

    const handleSelectAthlete =
        async (athlete) => {

            if (
                !athlete ||
                selectingAthlete
            ) {

                return;

            }

            // ---------------------------------
            // SAME ATHLETE
            //
            // Do not select the already
            // selected athlete again.
            // ---------------------------------

            if (
                currentAthlete &&
                currentAthlete.entryId
                    ?.toString() ===
                athlete.entryId
                    ?.toString()
            ) {

                return;

            }

            // ---------------------------------
            // CURRENT ATHLETE STILL REQUIRES
            // DECLARATION
            // ---------------------------------

            if (
                currentAthlete &&
                !canSelectAnotherAthlete
            ) {

                setLiftError(
                    "Declare the current athlete's next attempt before selecting another athlete."
                );

                return;

            }

            // ---------------------------------
            // INVALID ATTEMPT
            // ---------------------------------

            if (
                !athlete.currentAttempt
            ) {

                setLiftError(
                    "This athlete does not have a valid current attempt."
                );

                return;

            }

            // ---------------------------------
            // WRONG PHASE
            // ---------------------------------

            if (
                athlete.currentAttempt.phase !==
                currentPhase
            ) {

                setLiftError(
                    `This athlete belongs to ${athlete.currentAttempt.phase}, while the live session is in ${currentPhase}.`
                );

                return;

            }

            // ---------------------------------
            // COMPLETED ATHLETE
            // ---------------------------------

            if (
                athlete.currentAttempt.completed
            ) {

                setLiftError(
                    "This athlete has completed the competition."
                );

                return;

            }

            try {

                setSelectingAthlete(
                    true
                );

                setLiftError("");
                setLiftMessage("");

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

                setLiftMessage(
                    `${athlete.name} selected.`
                );

                await loadLiveCompetition(
                    false
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

                setSelectingAthlete(
                    false
                );

            }

        };

    // =====================================
    // SAVE DECLARATION
    //
    // DECLARATION ONLY.
    //
    // Does NOT automatically select
    // another athlete.
    //
    // AFTER SAVING:
    //
    // Backend returns canSelectAnotherAthlete
    // = true.
    //
    // Therefore official can select another
    // athlete.
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

                setSavingDeclaration(
                    true
                );

                setLiftError("");
                setLiftMessage("");

                await saveDeclaredWeight({
                    entryId:
                        currentAthlete.entryId,

                    declaredWeight:
                        weight,
                });

                setLiftMessage(
                    "Declaration saved successfully. You can now select the next eligible athlete."
                );

                // =================================
                // IMPORTANT
                //
                // Reload immediately after saving.
                //
                // This updates:
                //
                // canSelectAnotherAthlete
                //
                // from false -> true.
                //
                // The declaration input will NOT
                // revert because declarationKey
                // remains unchanged.
                // =================================

                await loadLiveCompetition(
                    false
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

                setSavingDeclaration(
                    false
                );

            }

        };

    // =====================================
    // PROCESS LIFT
    //
    // GOOD / NO LIFT
    //
    // Current athlete remains selected
    // when another attempt exists.
    //
    // Official can immediately declare
    // the athlete's next attempt.
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

                setProcessingLift(
                    true
                );

                setLiftMessage("");
                setLiftError("");

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

                // ---------------------------------
                // Fresh declaration for next
                // attempt.
                // ---------------------------------

                setDeclaredWeight("");

                lastDeclarationKey.current =
                    null;

                await loadLiveCompetition(
                    false
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

                setProcessingLift(
                    false
                );

            }

        };

    // =====================================
    // GET DISPLAY WEIGHT
    // =====================================

    const getCurrentWeight = (
        athlete
    ) => {

        if (!athlete) {
            return null;
        }

        const attempt =
            athlete.currentAttempt;

        if (!attempt) {
            return null;
        }

        // ---------------------------------
        // Declared weight
        // ---------------------------------

        if (
            attempt.declaredWeight != null &&
            attempt.declaredWeight > 0
        ) {

            return attempt.declaredWeight;

        }

        // ---------------------------------
        // Attempt 1
        // ---------------------------------

        if (
            attempt.attemptNo === 1
        ) {

            return (
                attempt.phase === "SNATCH"
                    ? athlete.openingSnatch
                    : athlete.openingCleanJerk
            );

        }

        return null;

    };

    // =====================================
    // RENDER ATTEMPT
    // =====================================

    const renderAttempt = (
        attempt,
        openingWeight = null
    ) => {

        if (!attempt) {
            return "-";
        }

        const displayWeight =
            attempt.attemptNo === 1
                ? (
                    attempt.declaredWeight ??
                    openingWeight
                )
                : attempt.declaredWeight;

        if (
            attempt.result === "GOOD"
        ) {

            return (
                <span className="attempt-good">
                    {displayWeight ?? "-"} ✓
                </span>
            );

        }

        if (
            attempt.result === "NO_LIFT"
        ) {

            return (
                <span className="attempt-fail">
                    {displayWeight ?? "-"} ✗
                </span>
            );

        }

        return (
            <span className="attempt-pending">
                {displayWeight ?? "-"}
            </span>
        );

    };

    // =====================================
    // OFFICIAL ATHLETE LIST
    // =====================================

    const officialAthletes =
        Array.isArray(athletes)
            ? athletes
            : [];

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
    // CURRENT ATTEMPT
    // =====================================

    const currentAttempt =
        currentAthlete?.currentAttempt;

    const isAttemptOne =
        currentAttempt?.attemptNo === 1;

    const currentWeight =
        getCurrentWeight(
            currentAthlete
        );

    // =====================================
    // UI
    // =====================================

    return (
        <div className="live-score-page">

            {/* =================================
                HEADER
            ================================= */}

            <header className="live-score-header">

                <div>

                    <h1>
                        Live Competition
                    </h1>

                    <p>
                        Competition:{" "}
                        {competitionId}
                    </p>

                </div>

                <div className="live-score-session">

                    <span>
                        Status: {status}
                    </span>

                    <span>
                        Phase: {currentPhase}
                    </span>

                    <span>
                        Athletes: {totalAthletes}
                    </span>

                </div>

            </header>

            {/* =================================
                STATUS MESSAGE
            ================================= */}

            {(liftMessage ||
                liftError ||
                processingLift ||
                savingDeclaration ||
                selectingAthlete ||
                startingCompetition) && (

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

            <section className="live-score-current">

                <div className="live-score-current-header">

                    <h2>
                        Current Athlete
                    </h2>

                    {currentAthlete && (
                        <span>
                            ON PLATFORM
                        </span>
                    )}

                </div>

                {!currentAthlete ? (

                    <div className="live-score-empty">

                        <h2>
                            PLATFORM EMPTY
                        </h2>

                        <p>
                            Official must manually
                            select the next athlete.
                        </p>

                    </div>

                ) : (

                    <div className="current-athlete-panel">

                        {/* =================================
                            ATHLETE INFORMATION
                        ================================= */}

                        <div className="current-athlete-main">

                            <div>

                                <div className="current-athlete-label">
                                    ATHLETE
                                </div>

                                <h1>
                                    {currentAthlete.name}
                                </h1>

                            </div>

                            <div className="current-athlete-meta">

                                <div>

                                    <strong>
                                        Lot
                                    </strong>

                                    <span>
                                        {
                                            currentAthlete
                                                .lotNumber
                                        }
                                    </span>

                                </div>

                                <div>

                                    <strong>
                                        Attempt
                                    </strong>

                                    <span>
                                        {
                                            currentAttempt
                                                ?.phase
                                        }{" "}
                                        {
                                            currentAttempt
                                                ?.attemptNo
                                        }
                                    </span>

                                </div>

                                <div>

                                    <strong>
                                        Weight
                                    </strong>

                                    <span>
                                        {
                                            currentWeight ??
                                            "-"
                                        } kg
                                    </span>

                                </div>

                            </div>

                        </div>

                        {/* =================================
                            DECLARATION
                        ================================= */}

                        <div className="current-athlete-declaration">

                            <label>
                                Declared Weight (kg)
                            </label>

                            <div className="declaration-control">

                                <input
                                    type="number"
                                    min="1"
                                    value={
                                        declaredWeight
                                    }
                                    disabled={
                                        savingDeclaration ||
                                        processingLift
                                    }
                                    onChange={(e) =>
                                        setDeclaredWeight(
                                            e.target.value
                                        )
                                    }
                                />

                                <button
                                    type="button"
                                    onClick={
                                        handleSaveDeclaration
                                    }
                                    disabled={
                                        savingDeclaration ||
                                        processingLift ||
                                        !declaredWeight
                                    }
                                >
                                    {savingDeclaration
                                        ? "Saving..."
                                        : "Save Declaration"}
                                </button>

                            </div>

                            {isAttemptOne && (
                                <small>
                                    Attempt 1 starts with the
                                    opening weight, but the
                                    declaration can be edited
                                    before the lift is judged.
                                </small>
                            )}

                            {/* =================================
                                SELECTION STATE
                            ================================= */}

                            {!canSelectAnotherAthlete && (
                                <small>
                                    Declare this athlete's next
                                    attempt before selecting
                                    another athlete.
                                </small>
                            )}

                            {canSelectAnotherAthlete && (
                                <small>
                                    Declaration saved. You can
                                    now select the next athlete.
                                </small>
                            )}

                        </div>

                        {/* =================================
                            OFFICIAL DECISION
                        ================================= */}

                        <div className="lift-decision">

                            <button
                                type="button"
                                className="good-btn"
                                disabled={
                                    processingLift
                                }
                                onClick={() =>
                                    handleProcessLift(
                                        "GOOD"
                                    )
                                }
                            >
                                GOOD LIFT
                            </button>

                            <button
                                type="button"
                                className="no-lift-btn"
                                disabled={
                                    processingLift
                                }
                                onClick={() =>
                                    handleProcessLift(
                                        "NO_LIFT"
                                    )
                                }
                            >
                                NO LIFT
                            </button>

                        </div>

                    </div>
                )}

            </section>

            {/* =================================
                OFFICIAL ATHLETE SELECTION
            ================================= */}

            <section className="official-athlete-list">

                <div className="official-list-header">

                    <div>

                        <h2>
                            Official Athlete Selection
                        </h2>

                        <p>
                            Select the athlete manually.
                            The system will not decide who
                            lifts next.
                        </p>

                        {/* =================================
                            SELECTION STATUS
                        ================================= */}

                        {currentAthlete &&
                            !canSelectAnotherAthlete && (

                            <p className="selection-locked-message">
                                Current athlete must have the
                                next attempt declared before
                                another athlete can be selected.
                            </p>

                        )}

                        {currentAthlete &&
                            canSelectAnotherAthlete && (

                            <p className="selection-ready-message">
                                Ready — select the next eligible
                                athlete.
                            </p>

                        )}

                    </div>

                    <strong>
                        {officialAthletes.length} athletes
                    </strong>

                </div>

                <div className="official-list-table-wrapper">

                    <table className="official-athlete-table">

                        <thead>

                            <tr>

                                <th>
                                    Lot
                                </th>

                                <th>
                                    Name
                                </th>

                                <th>
                                    Category
                                </th>

                                <th>
                                    Attempt
                                </th>

                                <th>
                                    Weight
                                </th>

                                <th>
                                    Action
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {officialAthletes.map(
                                (athlete) => {

                                    const attempt =
                                        athlete.currentAttempt;

                                    const weight =
                                        getCurrentWeight(
                                            athlete
                                        );

                                    const isSelected =
                                        currentAthlete &&
                                        currentAthlete.entryId
                                            ?.toString() ===
                                        athlete.entryId
                                            ?.toString();

                                    const isCompleted =
                                        attempt?.completed ===
                                        true;

                                    const wrongPhase =
                                        attempt &&
                                        attempt.phase !==
                                        currentPhase;

                                    // =================================
                                    // CAN THIS ATHLETE BE SELECTED?
                                    //
                                    // Backend is the final authority,
                                    // but frontend disables obviously
                                    // invalid choices.
                                    // =================================

                                    const canSelectThisAthlete =
                                        !selectingAthlete &&
                                        !isSelected &&
                                        !isCompleted &&
                                        !wrongPhase &&
                                        (
                                            !currentAthlete ||
                                            canSelectAnotherAthlete
                                        );

                                    return (

                                        <tr
                                            key={
                                                athlete.entryId
                                            }
                                            className={
                                                isSelected
                                                    ? "official-selected-row"
                                                    : isCompleted
                                                    ? "official-completed-row"
                                                    : ""
                                            }
                                        >

                                            {/* LOT */}

                                            <td>
                                                {
                                                    athlete.lotNumber
                                                }
                                            </td>

                                            {/* NAME */}

                                            <td>
                                                <strong>
                                                    {
                                                        athlete.name
                                                    }
                                                </strong>
                                            </td>

                                            {/* CATEGORY */}

                                            <td>
                                                {
                                                    athlete.weightCategory ??
                                                    "-"
                                                }
                                            </td>

                                            {/* ATTEMPT */}

                                            <td>
                                                {
                                                    attempt?.phase ??
                                                    "-"
                                                }{" "}
                                                {
                                                    attempt?.attemptNo ??
                                                    "-"
                                                }
                                            </td>

                                            {/* WEIGHT */}

                                            <td>
                                                {
                                                    weight ??
                                                    "-"
                                                } kg
                                            </td>

                                            {/* ACTION */}

                                            <td>

                                                <button
                                                    type="button"
                                                    className="select-athlete-btn"
                                                    disabled={
                                                        !canSelectThisAthlete
                                                    }
                                                    onClick={() =>
                                                        handleSelectAthlete(
                                                            athlete
                                                        )
                                                    }
                                                >

                                                    {isSelected
                                                        ? "SELECTED"
                                                        : isCompleted
                                                        ? "COMPLETED"
                                                        : wrongPhase
                                                        ? "WRONG PHASE"
                                                        : selectingAthlete
                                                        ? "SELECTING..."
                                                        : currentAthlete &&
                                                          !canSelectAnotherAthlete
                                                        ? "DECLARATION REQUIRED"
                                                        : "SELECT"}

                                                </button>

                                            </td>

                                        </tr>

                                    );

                                }
                            )}

                            {!officialAthletes.length && (

                                <tr>

                                    <td
                                        colSpan="6"
                                        className="no-athletes-cell"
                                    >
                                        No athletes available.
                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

            </section>

            {/* =================================
                LIVE SCOREBOARD
            ================================= */}

            <section className="scoreboard">

                <div className="scoreboard-header">

                    <h2>
                        Live Scoreboard
                    </h2>

                </div>

                <div className="scoreboard-wrapper">

                    <table className="scoreboard-table">

                        <thead>

                            <tr>

                                <th>
                                    Lot
                                </th>

                                <th>
                                    Name
                                </th>

                                <th>
                                    S1
                                </th>

                                <th>
                                    S2
                                </th>

                                <th>
                                    S3
                                </th>

                                <th>
                                    CJ1
                                </th>

                                <th>
                                    CJ2
                                </th>

                                <th>
                                    CJ3
                                </th>

                                <th>
                                    Best S
                                </th>

                                <th>
                                    Best CJ
                                </th>

                                <th>
                                    Total
                                </th>

                                <th>
                                    Rank
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {competitionResults.map(
                                (athlete) => {

                                    const isCurrent =
                                        currentAthlete &&
                                        currentAthlete.entryId
                                            ?.toString() ===
                                        athlete.entryId
                                            ?.toString();

                                    const rowClass =
                                        isCurrent
                                            ? "scoreboard-current-row"
                                            : athlete.status ===
                                              "COMPLETED"
                                            ? "scoreboard-completed-row"
                                            : "";

                                    return (

                                        <tr
                                            key={
                                                athlete.entryId
                                            }
                                            className={
                                                rowClass
                                            }
                                        >

                                            {/* LOT */}

                                            <td>
                                                {
                                                    athlete.lotNumber
                                                }
                                            </td>

                                            {/* NAME */}

                                            <td>
                                                <strong>
                                                    {
                                                        athlete.name
                                                    }
                                                </strong>
                                            </td>

                                            {/* S1 */}

                                            <td>
                                                {renderAttempt(
                                                    athlete
                                                        .snatchAttempts
                                                        ?.[0],
                                                    athlete.openingSnatch
                                                )}
                                            </td>

                                            {/* S2 */}

                                            <td>
                                                {renderAttempt(
                                                    athlete
                                                        .snatchAttempts
                                                        ?.[1]
                                                )}
                                            </td>

                                            {/* S3 */}

                                            <td>
                                                {renderAttempt(
                                                    athlete
                                                        .snatchAttempts
                                                        ?.[2]
                                                )}
                                            </td>

                                            {/* CJ1 */}

                                            <td>
                                                {renderAttempt(
                                                    athlete
                                                        .cleanJerkAttempts
                                                        ?.[0],
                                                    athlete.openingCleanJerk
                                                )}
                                            </td>

                                            {/* CJ2 */}

                                            <td>
                                                {renderAttempt(
                                                    athlete
                                                        .cleanJerkAttempts
                                                        ?.[1]
                                                )}
                                            </td>

                                            {/* CJ3 */}

                                            <td>
                                                {renderAttempt(
                                                    athlete
                                                        .cleanJerkAttempts
                                                        ?.[2]
                                                )}
                                            </td>

                                            {/* BEST SNATCH */}

                                            <td>
                                                <strong>
                                                    {
                                                        athlete.bestSnatch ??
                                                        0
                                                    }
                                                </strong>
                                            </td>

                                            {/* BEST CLEAN & JERK */}

                                            <td>
                                                <strong>
                                                    {
                                                        athlete.bestCleanJerk ??
                                                        0
                                                    }
                                                </strong>
                                            </td>

                                            {/* TOTAL */}

                                            <td>
                                                <strong>
                                                    {
                                                        athlete.total ??
                                                        0
                                                    }
                                                </strong>
                                            </td>

                                            {/* RANK */}

                                            <td>
                                                {
                                                    athlete.place ??
                                                    athlete.rank ??
                                                    "-"
                                                }
                                            </td>

                                        </tr>

                                    );

                                }
                            )}

                            {!competitionResults.length && (

                                <tr>

                                    <td
                                        colSpan="12"
                                        className="no-scoreboard-data"
                                    >
                                        No scoreboard data available.
                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

            </section>

        </div>
    );
};

export default LiveScore;