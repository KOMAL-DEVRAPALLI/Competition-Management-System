import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
    apiRequest,
    processLift,
    saveDeclaredWeight,
    updateQueueDeclaration,
} from "../../api/axios";

import CurrentAthleteCard from "../../components/Admin/LiveScoreSheet/CurrentLifterCard";
import PrepareNextAttemptCard from "../../components/Admin/LiveScoreSheet/PrepareNextAthleteCard";
import DeclarationQueue from "../../components/Admin/LiveScoreSheet/DeclarationQueue";
import ScoreboardTable from "../../components/Admin/LiveScoreSheet/LiveResultTable";

import "./LiveScore.css";

const LiveScore = () => {

    const {
        competitionId,
        gender,
    } = useParams();

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

    const [liftMessage, setLiftMessage] =
        useState("");

    const [liftError, setLiftError] =
        useState("");

    const {
    currentAthlete,
    prepareAthlete,
    nextAthlete,
    declarationQueue,
    competitionResults,
    status,
    currentPhase,
    totalAthletes,
} = liveCompetition || {};

    // -----------------------------------
    // DISPLAYED LIFT
    //
    // Actual platform athlete always has
    // priority.
    //
    // Last lift is shown only when the
    // platform is temporarily empty.
    // -----------------------------------

   const displayedAthlete =
    currentAthlete ?? null;

    // -----------------------------------
    // Initial live competition load
    // -----------------------------------

    useEffect(() => {

        loadLiveCompetition();

    }, []);

    // -----------------------------------
    // Update declaration input whenever
    // prepare athlete changes
    // -----------------------------------

    useEffect(() => {

        if (!prepareAthlete) {

            setDeclaredWeight("");

            return;
        }

        setDeclaredWeight(
            prepareAthlete
                .currentAttempt
                ?.declaredWeight ?? ""
        );

    }, [prepareAthlete]);

    // -----------------------------------
    // Load live competition
    // -----------------------------------

    const loadLiveCompetition = async () => {

        try {

            const response =
                await apiRequest(
                    `/live-competition/${competitionId}/${gender}`,
                    "GET"
                );

            const newLiveCompetition =
                response.data;

            setLiveCompetition(
                newLiveCompetition
            );

            return newLiveCompetition;

        } catch (error) {

            console.error(
                "Failed to load live competition:",
                error
            );

            console.log(
                "Backend Response:",
                error.response?.data
            );

            throw error;

        } finally {

            setLoading(false);

        }

    };

    // -----------------------------------
    // Save declaration for Prepare athlete
    // -----------------------------------

    const handlePrepareDeclaration =
        async () => {

            if (
                !prepareAthlete ||
                savingDeclaration
            ) {
                return;
            }

            if (
                declaredWeight === "" ||
                Number(declaredWeight) <= 0
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
                        prepareAthlete.entryId,

                    declaredWeight:
                        Number(declaredWeight),

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
    // Process Good Lift / No Lift
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

    // -----------------------------------
    // Queue declaration
    // -----------------------------------

    const handleQueueDeclaration =
        async (
            entryId,
            declaredWeight
        ) => {

            try {

                setLiftError("");
                setLiftMessage("");

                await updateQueueDeclaration({

                    entryId,

                    declaredWeight,

                });

                await loadLiveCompetition();

            } catch (error) {

                console.error(
                    "Failed to update queue declaration:",
                    error
                );

                setLiftError(
                    error.response
                        ?.data
                        ?.message ||
                    error.message ||
                    "Failed to update declaration."
                );

            }

        };

    // -----------------------------------
    // Loading
    // -----------------------------------

    if (loading) {

        return (
            <h2>
                Loading Live Competition...
            </h2>
        );

    }

    // -----------------------------------
    // UI
    // -----------------------------------

    return (

        <div className="live-score-page">

            <header className="live-score-header">

                <h1>
                    Live Competition
                </h1>

                <div className="live-score-session">

                    <span>
                        Status : {status}
                    </span>

                    <span>
                        Phase : {currentPhase}
                    </span>

                    <span>
                        Athletes : {totalAthletes}
                    </span>

                </div>

            </header>

            <main className="live-score-content">

                {/* ---------------------------------
                    Lift status
                ---------------------------------- */}

                {(processingLift ||
                    savingDeclaration ||
                    liftMessage ||
                    liftError) && (

                    <div
                        className={`lift-status ${
                            processingLift ||
                            savingDeclaration
                                ? "lift-status-processing"
                                : liftError
                                    ? "lift-status-error"
                                    : "lift-status-success"
                        }`}
                    >

                        {(processingLift ||
                            savingDeclaration) && (

                            <span>
                                {processingLift
                                    ? "Saving lift result..."
                                    : "Saving declaration..."}
                            </span>

                        )}

                        {!processingLift &&
                            !savingDeclaration &&
                            liftMessage && (

                                <span>
                                    ✓ {liftMessage}
                                </span>

                            )}

                        {!processingLift &&
                            !savingDeclaration &&
                            liftError && (

                                <span>
                                    ✕ {liftError}
                                </span>

                            )}

                    </div>

                )}

                <section className="live-score-top">

                    <CurrentAthleteCard
                        currentAthlete={
                            displayedAthlete
                        }

                        processingLift={
                            processingLift
                        }

                        onGoodLift={() =>
                            handleProcessLift(
                                "GOOD"
                            )
                        }

                        onNoLift={() =>
                            handleProcessLift(
                                "NO_LIFT"
                            )
                        }
                    />

                    <PrepareNextAttemptCard
                        prepareAthlete={
                            prepareAthlete
                        }

                        declaredWeight={
                            declaredWeight
                        }

                        setDeclaredWeight={
                            setDeclaredWeight
                        }

                        onSaveWeight={
                            handlePrepareDeclaration
                        }

                        savingDeclaration={
                            savingDeclaration
                        }

                    />

                </section>

                <section className="live-score-middle">

                    <DeclarationQueue
                        declarationQueue={
                            declarationQueue
                        }

                        onSaveWeight={
                            handleQueueDeclaration
                        }

                    />

                </section>

                <section className="live-score-bottom">

                    <ScoreboardTable
                        competitionResults={
                            competitionResults
                        }
                    />

                </section>

            </main>

        </div>

    );

};

export default LiveScore;