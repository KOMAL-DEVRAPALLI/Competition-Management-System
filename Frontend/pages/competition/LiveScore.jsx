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


    const SELECT_ATHLETE_URL =
        "/live-competition/select-official-athlete";


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


    const [
        savingDeclarationEntryId,
        setSavingDeclarationEntryId,
    ] = useState(null);


    const [selectingAthlete, setSelectingAthlete] =
        useState(false);


    const [startingCompetition, setStartingCompetition] =
        useState(false);


    const [liftMessage, setLiftMessage] =
        useState("");


    const [liftError, setLiftError] =
        useState("");


    const {
        currentAthlete = null,
        athletes = [],
        competitionResults = [],
        status = "READY",
        currentPhase = "SNATCH",
        totalAthletes = 0,
    } = liveCompetition || {};


    const currentAttempt =
        currentAthlete?.currentAttempt ?? null;


    const canSelectAnotherAthlete = true;


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


    useEffect(() => {

        loadLiveCompetition();

    }, [competitionId, gender]);


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


        setDeclaredWeight("");

    }, [currentAthlete]);


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


    const handleSelectAthlete =
        async (athlete) => {

        if (
            !athlete ||
            selectingAthlete
        ) {

            return;

        }


        try {

            setSelectingAthlete(true);

            setLiftError("");
            setLiftMessage("");


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


            console.log(
                "SELECT ATHLETE RESPONSE:",
                response.data
            );


            setLiftMessage(
                `${athlete.name} selected.`
            );


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


        const attempt =
            athlete.currentAttempt;


        if (!attempt) {

            setLiftError(
                "This athlete does not have a pending attempt."
            );

            return;

        }


        if (
            attempt.completed ||
            athlete.status === "COMPLETED"
        ) {

            setLiftError(
                "This athlete has completed the competition."
            );

            return;

        }


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


        if (
            attempt.result &&
            attempt.result !== "PENDING"
        ) {

            setLiftError(
                "This attempt has already been completed."
            );

            return;

        }


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


            await saveDeclaredWeight({

                entryId,

                declaredWeight:
                    weight,

            });


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

                        currentAthlete:
                            previous.currentAthlete,

                        athletes:
                            previous.athletes?.map(
                                updateAthlete
                            ),

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


            const updatedCurrentAthlete = {

                ...currentAthlete,

                snatchAttempts:
                    updatedEntry.snatchAttempts ??
                    currentAthlete.snatchAttempts,

                cleanJerkAttempts:
                    updatedEntry.cleanJerkAttempts ??
                    currentAthlete.cleanJerkAttempts,

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

                currentAttempt:
                    nextAttempt,

            };


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


            let updatedCanSelect =
                false;


            if (
                data.manualSelectionRequired
            ) {

                updatedCanSelect =
                    true;

            } else if (
                nextAttempt &&
                nextAttempt.declaredWeight != null &&
                Number(
                    nextAttempt.declaredWeight
                ) > 0
            ) {

                updatedCanSelect =
                    true;

            }


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


            setDeclaredWeight("");


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


    const showStatus =
        liftMessage ||
        liftError ||
        processingLift ||
        savingDeclaration ||
        selectingAthlete ||
        startingCompetition ||
        savingDeclarationEntryId;


    return (

        <div className="live-score-page">

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


            <CurrentAthletePanel

                currentAthlete={
                    currentAthlete
                }

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

                onEditDeclaration={
                    handleEditDeclaration
                }

                savingDeclarationEntryId={
                    savingDeclarationEntryId
                }

            />


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