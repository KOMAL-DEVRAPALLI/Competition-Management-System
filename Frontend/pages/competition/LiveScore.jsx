import { useEffect, useState } from "react";
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

    // -----------------------------------
    // API
    // -----------------------------------

    const SELECT_ATHLETE_URL =
        "/live-competition/select-official-athlete";

    // -----------------------------------
    // State
    // -----------------------------------

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

    const [liftMessage, setLiftMessage] =
        useState("");

    const [liftError, setLiftError] =
        useState("");

    // -----------------------------------
    // Live data
    // -----------------------------------

    const {
        currentAthlete,
        declarationQueue = [],
        competitionResults = [],
        status,
        currentPhase,
        totalAthletes,
    } = liveCompetition || {};

    // -----------------------------------
    // Load live competition
    // -----------------------------------

    useEffect(() => {

        loadLiveCompetition();

    }, []);

    // -----------------------------------
    // Keep declaration input synced with
    // CURRENT athlete
    // -----------------------------------

    useEffect(() => {

        if (!currentAthlete) {

            setDeclaredWeight("");

            return;
        }

        const attempt =
            currentAthlete.currentAttempt;

        if (
            attempt?.declaredWeight != null
        ) {

            setDeclaredWeight(
                attempt.declaredWeight
            );

            return;
        }

        // Attempt 1 uses opening weight
        if (
            attempt?.attemptNo === 1
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

        setDeclaredWeight("");

    }, [currentAthlete]);

    // -----------------------------------
    // LOAD LIVE COMPETITION
    // -----------------------------------

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

    // -----------------------------------
    // SELECT ATHLETE
    //
    // Official manually chooses the
    // athlete.
    //
    // NO automatic ordering.
    // NO selectNextAthlete().
    // -----------------------------------

    const handleSelectAthlete = async (
        athlete
    ) => {

        if (
            !athlete ||
            selectingAthlete
        ) {
            return;
        }

        // -----------------------------------
        // Do not allow another selection
        // while somebody is on platform.
        // -----------------------------------

        if (currentAthlete) {

            setLiftError(
                "Complete the current athlete before selecting another athlete."
            );

            return;

        }

        try {

            setSelectingAthlete(true);

            setLiftError("");
            setLiftMessage("");

            console.log(
                "===== OFFICIAL SELECT ATHLETE ====="
            );

            console.log(
                "Entry ID:",
                athlete.entryId
            );

            console.log(
                "Name:",
                athlete.name
            );

            // -----------------------------------
            // IMPORTANT
            //
            // Official selection endpoint.
            // -----------------------------------

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

            // -----------------------------------
            // Refresh live state
            // -----------------------------------

            await loadLiveCompetition();

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

    // -----------------------------------
    // SAVE DECLARATION
    //
    // Declaration belongs ONLY to the
    // manually selected athlete.
    // -----------------------------------

    const handleSaveDeclaration =
        async () => {

            if (
                !currentAthlete ||
                savingDeclaration
            ) {
                return;
            }

            const weight =
                Number(declaredWeight);

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

    // -----------------------------------
    // PROCESS GOOD / NO LIFT
    // -----------------------------------

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

                // -----------------------------------
                // Save official result
                // -----------------------------------

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

                // -----------------------------------
                // IMPORTANT
                //
                // Backend clears currentEntryId.
                //
                // Therefore after refresh:
                //
                // currentAthlete === null
                //
                // Official must manually select
                // the next athlete.
                // -----------------------------------

                await loadLiveCompetition();

                setDeclaredWeight("");

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

    // -----------------------------------
    // START COMPETITION
    //
    // This only creates/initializes the
    // live session.
    //
    // It does NOT choose an athlete here.
    // -----------------------------------

    const handleStartCompetition =
        async () => {

            try {

                setLiftError("");
                setLiftMessage("");

                await apiRequest(
                    "/live-competition/start",
                    "POST",
                    {
                        competitionId,
                        gender,
                    }
                );

                setLiftMessage(
                    "Live competition started."
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

            }

        };

    // -----------------------------------
    // DISPLAY WEIGHT
    // -----------------------------------

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

        if (
            attempt.declaredWeight != null
        ) {

            return attempt.declaredWeight;

        }

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

    // -----------------------------------
    // ATTEMPT DISPLAY
    // -----------------------------------

    const renderAttempt = (
        attempt,
        openingWeight = null
    ) => {

        if (!attempt) {
            return "-";
        }

        const displayWeight =
            attempt.attemptNo === 1
                ? attempt.declaredWeight ??
                  openingWeight
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

    // -----------------------------------
    // LOADING
    // -----------------------------------

    if (loading) {

        return (
            <div className="live-score-page">

                <h2>
                    Loading Live Competition...
                </h2>

            </div>
        );

    }

    // -----------------------------------
    // CURRENT ATTEMPT
    // -----------------------------------

    const currentAttempt =
        currentAthlete?.currentAttempt;

    const isAttemptOne =
        currentAttempt?.attemptNo === 1;

    const currentWeight =
        getCurrentWeight(
            currentAthlete
        );

    // -----------------------------------
    // UI
    // -----------------------------------

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
                selectingAthlete) && (

                <div
                    className={
                        liftError
                            ? "lift-status lift-status-error"
                            : "lift-status lift-status-success"
                    }
                >

                    {selectingAthlete &&
                        "Selecting athlete..."}

                    {!selectingAthlete &&
                        savingDeclaration &&
                        "Saving declaration..."}

                    {!selectingAthlete &&
                        !savingDeclaration &&
                        processingLift &&
                        "Saving lift result..."}

                    {!selectingAthlete &&
                        !savingDeclaration &&
                        !processingLift &&
                        liftMessage &&
                        `✓ ${liftMessage}`}

                    {liftError &&
                        `✕ ${liftError}`}

                </div>

            )}

            {/* =================================
                START BUTTON
            ================================= */}

            {!currentAthlete &&
                status === "READY" && (

                <div
                    className="live-score-start"
                >

                    <button
                        type="button"
                        onClick={
                            handleStartCompetition
                        }
                        disabled={
                            selectingAthlete
                        }
                    >
                        Start Competition
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

                    <div
                        className="live-score-empty"
                    >

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
                                            currentAthlete.lotNumber
                                        }
                                    </span>
                                </div>

                                <div>
                                    <strong>
                                        Attempt
                                    </strong>

                                    <span>
                                        {
                                            currentAttempt?.phase
                                        }{" "}
                                        {
                                            currentAttempt?.attemptNo
                                        }
                                    </span>
                                </div>

                                <div>
                                    <strong>
                                        Weight
                                    </strong>

                                    <span>
                                        {currentWeight}
                                        {" "}kg
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

                            <div
                                className="declaration-control"
                            >

                                <input
                                    type="number"
                                    min="1"
                                    value={
                                        declaredWeight
                                    }
                                    disabled={
                                        isAttemptOne ||
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
                                        isAttemptOne ||
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
                                    Attempt 1 uses the
                                    opening weight.
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
                OFFICIAL ATHLETE LIST
            ================================= */}

            <section className="official-athlete-list">

                <div className="official-list-header">

                    <div>

                        <h2>
                            Official Athlete List
                        </h2>

                        <p>
                            Select any athlete manually.
                            No automatic athlete selection.
                        </p>

                    </div>

                    <strong>
                        {
                            declarationQueue.length
                        } athletes
                    </strong>

                </div>

                <div className="official-list-table-wrapper">

                    <table
                        className="official-athlete-table"
                    >

                        <thead>

                            <tr>

                                <th>
                                    Lot
                                </th>

                                <th>
                                    Name
                                </th>

                                <th>
                                    Attempt
                                </th>

                                <th>
                                    Current / Opening
                                </th>

                                <th>
                                    Declared
                                </th>

                                <th>
                                    Action
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {declarationQueue.map(
                                (athlete) => {

                                    const attempt =
                                        athlete.currentAttempt;

                                    const weight =
                                        getCurrentWeight(
                                            athlete
                                        );

                                    const isSelected =
                                        currentAthlete &&
                                        currentAthlete
                                            .entryId
                                            ?.toString() ===
                                        athlete.entryId
                                            ?.toString();

                                    return (

                                        <tr
                                            key={
                                                athlete.entryId
                                            }
                                            className={
                                                isSelected
                                                    ? "official-selected-row"
                                                    : ""
                                            }
                                        >

                                            <td>
                                                {
                                                    athlete.lotNumber
                                                }
                                            </td>

                                            <td>

                                                <strong>
                                                    {
                                                        athlete.name
                                                    }
                                                </strong>

                                            </td>

                                            <td>

                                                {
                                                    attempt?.phase
                                                }{" "}
                                                {
                                                    attempt?.attemptNo
                                                }

                                            </td>

                                            <td>

                                                {
                                                    weight ??
                                                    "-"
                                                } kg

                                            </td>

                                            <td>

                                                {
                                                    attempt
                                                        ?.declaredWeight ??
                                                    "-"
                                                } kg

                                            </td>

                                            <td>

                                                <button
                                                    type="button"
                                                    className="select-athlete-btn"
                                                    disabled={
                                                        !!currentAthlete ||
                                                        selectingAthlete
                                                    }
                                                    onClick={() =>
                                                        handleSelectAthlete(
                                                            athlete
                                                        )
                                                    }
                                                >
                                                    {selectingAthlete
                                                        ? "Selecting..."
                                                        : "SELECT"}
                                                </button>

                                            </td>

                                        </tr>

                                    );

                                }
                            )}

                            {!declarationQueue.length && (

                                <tr>

                                    <td
                                        colSpan="6"
                                        style={{
                                            textAlign:
                                                "center",
                                            padding:
                                                "30px",
                                        }}
                                    >
                                        No athletes available
                                        in this phase.
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

                    <table
                        className="scoreboard-table"
                    >

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

                                    return (

                                        <tr
                                            key={
                                                athlete.entryId
                                            }
                                            className={
                                                athlete.status ===
                                                "ON_PLATFORM"
                                                    ? "scoreboard-current-row"
                                                    : athlete.status ===
                                                      "COMPLETED"
                                                    ? "scoreboard-completed-row"
                                                    : ""
                                            }
                                        >

                                            <td>
                                                {
                                                    athlete.lotNumber
                                                }
                                            </td>

                                            <td>

                                                <strong>
                                                    {
                                                        athlete.name
                                                    }
                                                </strong>

                                            </td>

                                            <td>
                                                {renderAttempt(
                                                    athlete
                                                        .snatchAttempts
                                                        ?. [0],
                                                    athlete
                                                        .openingSnatch
                                                )}
                                            </td>

                                            <td>
                                                {renderAttempt(
                                                    athlete
                                                        .snatchAttempts
                                                        ?. [1]
                                                )}
                                            </td>

                                            <td>
                                                {renderAttempt(
                                                    athlete
                                                        .snatchAttempts
                                                        ?. [2]
                                                )}
                                            </td>

                                            <td>
                                                {renderAttempt(
                                                    athlete
                                                        .cleanJerkAttempts
                                                        ?. [0],
                                                    athlete
                                                        .openingCleanJerk
                                                )}
                                            </td>

                                            <td>
                                                {renderAttempt(
                                                    athlete
                                                        .cleanJerkAttempts
                                                        ?. [1]
                                                )}
                                            </td>

                                            <td>
                                                {renderAttempt(
                                                    athlete
                                                        .cleanJerkAttempts
                                                        ?. [2]
                                                )}
                                            </td>

                                            <td>

                                                <strong>
                                                    {
                                                        athlete.bestSnatch
                                                    }
                                                </strong>

                                            </td>

                                            <td>

                                                <strong>
                                                    {
                                                        athlete.bestCleanJerk
                                                    }
                                                </strong>

                                            </td>

                                            <td>

                                                <strong>
                                                    {
                                                        athlete.total
                                                    }
                                                </strong>

                                            </td>

                                            <td>

                                                {
                                                    athlete.place ??
                                                    "-"
                                                }

                                            </td>

                                        </tr>

                                    );

                                }
                            )}

                        </tbody>

                    </table>

                </div>

            </section>

        </div>

    );

};

export default LiveScore;