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

    const { competitionId, gender } = useParams();

    const [loading, setLoading] = useState(true);

    const [liveCompetition, setLiveCompetition] =
        useState(null);

    const [declaredWeight, setDeclaredWeight] =
        useState("");

    const [processingLift, setProcessingLift] =
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
    // Initial live competition load
    // -----------------------------------

    useEffect(() => {

        loadLiveCompetition();

    }, []);

    // -----------------------------------
    // Update declaration input when
    // prepare athlete changes
    // -----------------------------------

    useEffect(() => {

        if (!prepareAthlete) {

            setDeclaredWeight("");

            return;

        }

        setDeclaredWeight(
            prepareAthlete.currentAttempt
                ?.declaredWeight ?? ""
        );

    }, [prepareAthlete]);

    // -----------------------------------
    // Load live competition
    // -----------------------------------

    const loadLiveCompetition = async () => {

        try {

            const response = await apiRequest(
                `/live-competition/${competitionId}/${gender}`,
                "GET"
            );

            setLiveCompetition(
                response.data
            );

        } catch (error) {

            console.error(
                "Failed to load live competition:",
                error
            );

            console.log(
                "Backend Response:",
                error.response?.data
            );

        } finally {

            setLoading(false);

        }

    };

    // -----------------------------------
    // Prepare athlete declaration
    // -----------------------------------

    const handlePrepareDeclaration = async () => {

        if (!prepareAthlete) return;

        try {

            await saveDeclaredWeight({

                entryId:
                    prepareAthlete.entryId,

                declaredWeight:
                    Number(declaredWeight),

            });

            await loadLiveCompetition();

        } catch (error) {

            console.error(
                "Failed to save declaration:",
                error
            );

        }

    };

    // -----------------------------------
    // Process Good Lift / No Lift
    // -----------------------------------

    const handleProcessLift = async (result) => {

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

            // -----------------------------------
            // Refresh complete live state
            // -----------------------------------

            await loadLiveCompetition();

            // -----------------------------------
            // Show confirmation
            // -----------------------------------

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
                error.response?.data?.message ||
                error.message ||
                "Failed to save lift."
            );

        } finally {

            setProcessingLift(false);

        }

    };

    // -----------------------------------
    // Current / next athlete declaration
    // -----------------------------------

    const handleCurrentDeclaration = async () => {

        if (!nextAthlete) return;

        try {

            await saveDeclaredWeight({

                entryId:
                    nextAthlete.entryId,

                declaredWeight:
                    Number(declaredWeight),

            });

            await loadLiveCompetition();

        } catch (error) {

            console.error(
                "Failed to save declaration:",
                error
            );

        }

    };

    // -----------------------------------
    // Declaration queue
    // -----------------------------------

    const handleQueueDeclaration = async (
        entryId,
        declaredWeight
    ) => {

        try {

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
                    liftMessage ||
                    liftError) && (

                    <div
                        className={`lift-status ${
                            processingLift
                                ? "lift-status-processing"
                                : liftError
                                    ? "lift-status-error"
                                    : "lift-status-success"
                        }`}
                    >

                        {processingLift && (
                            <span>
                                Saving lift result...
                            </span>
                        )}

                        {!processingLift &&
                            liftMessage && (
                                <span>
                                    ✓ {liftMessage}
                                </span>
                            )}

                        {!processingLift &&
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
        currentAthlete
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