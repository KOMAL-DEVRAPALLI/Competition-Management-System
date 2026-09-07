import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    useParams,
} from "react-router-dom";

import {
    apiRequest,
    processLift,
    saveDeclaredWeight,
    downloadFinalResultPdf,
    getCompetitionById,
} from "../../api/axios";

import "./LiveScore.css";

import LiveScoreHeader
    from "./components/LiveScoreHeader";

import OfficialsControlShell
    from "./components/OfficialsControlShell";

import CompetitionResults
    from "./components/CompetitionResults";


// =====================================
// LIVE SCORE
//
// Backend-authoritative Officials Screen.
//
// IMPORTANT STATE MODEL:
//
// currentAthlete:
//     Calling-order current athlete.
//
// platformAthlete:
//     Physical athlete currently on platform.
//
// These may intentionally differ.
//
// React:
// - displays authoritative state
// - submits official actions
// - keeps latest successful lift response
//
// React does NOT:
// - calculate calling order
// - select next athlete
// - reorder athletes
// =====================================

const LiveScore = () => {

    const {
        competitionId,
        gender,
    } = useParams();


    // =====================================
    // AUTHORITATIVE STATE
    // =====================================

    const [
        loading,
        setLoading,
    ] = useState(true);


    const [
        liveCompetition,
        setLiveCompetition,
    ] = useState(null);


    const [
        queueState,
        setQueueState,
    ] = useState(null);


    // =====================================
    // JUST COMPLETED
    // =====================================

    const [
        justCompleted,
        setJustCompleted,
    ] = useState(null);


    // =====================================
    // NEXT ATTEMPT DECLARATION
    //
    // Explicit UI state for the completed
    // athlete's next pending attempt.
    //
    // This is intentionally separate from:
    //
    // currentAthlete
    // platformAthlete
    // nextAthlete
    //
    // and from the authoritative queue.
    // =====================================

    const [
        nextAttemptDeclaration,
        setNextAttemptDeclaration,
    ] = useState(null);


    // =====================================
    // NEXT ATTEMPT ALLOCATION
    // =====================================

    const [
        nextAttemptDeclaredWeight,
        setNextAttemptDeclaredWeight,
    ] = useState("");


    const [
        savingNextAttemptAllocation,
        setSavingNextAttemptAllocation,
    ] = useState(false);


    // =====================================
    // CURRENT ATHLETE DECLARATION UI
    // =====================================

    const [
        declaredWeight,
        setDeclaredWeight,
    ] = useState("");


    const [
        savingDeclaration,
        setSavingDeclaration,
    ] = useState(false);


    // =====================================
    // DECLARATION EDIT ACTION
    // =====================================

    const [
        savingDeclarationEntryId,
        setSavingDeclarationEntryId,
    ] = useState(null);


    // =====================================
    // LIFT PROCESSING
    // =====================================

    const [
        processingLift,
        setProcessingLift,
    ] = useState(false);


    // =====================================
    // COMPLETED ATTEMPT RESULT CORRECTION
    // =====================================

    const [
        correctingCompletedAttemptResult,
        setCorrectingCompletedAttemptResult,
    ] = useState(false);


    // =====================================
    // COMPETITION START
    // =====================================

    const [
        startingCompetition,
        setStartingCompetition,
    ] = useState(false);


    // =====================================
    // STATUS
    // =====================================

    const [
        liftMessage,
        setLiftMessage,
    ] = useState("");


    const [
        liftError,
        setLiftError,
    ] = useState("");

// =====================================
// FINAL RESULT PDF
// =====================================

const [
    downloadingFinalResult,
    setDownloadingFinalResult,
] = useState(null);

const [
    competition,
    setCompetition,
] = useState(null);
    // =====================================
    // DERIVED AUTHORITATIVE STATE
    // =====================================

    const rawCurrentAthlete =
        queueState?.current ??
        liveCompetition?.currentAthlete ??
        null;


    const currentAthlete =
        rawCurrentAthlete
            ? {
                ...rawCurrentAthlete,

                currentAttempt:
                    rawCurrentAthlete.currentAttempt ??
                    {
                        phase:
                            rawCurrentAthlete.phase ??
                            null,

                        attemptNo:
                            rawCurrentAthlete.attemptNo ??
                            null,

                        declaredWeight:
                            rawCurrentAthlete.declaredWeight ??
                            null,

                        result:
                            rawCurrentAthlete.result ??
                            "PENDING",

                        completed:
                            rawCurrentAthlete.completed ??
                            false,

                        applicableWeight:
                            rawCurrentAthlete.applicableWeight ??
                            null,
                    },
            }
            : null;


    // =====================================
    // PHYSICAL PLATFORM ATHLETE
    //
    // IMPORTANT:
    //
    // This is intentionally separate from
    // currentAthlete.
    //
    // currentAthlete = calling current
    // platformAthlete = physical platform
    // =====================================

    const rawPlatformAthlete =
        queueState?.platform ??
        liveCompetition?.platformAthlete ??
        null;


    const platformAthlete =
        rawPlatformAthlete
            ? {
                ...rawPlatformAthlete,

                currentAttempt:
                    rawPlatformAthlete.currentAttempt ??
                    {
                        phase:
                            rawPlatformAthlete.phase ??
                            null,

                        attemptNo:
                            rawPlatformAthlete.attemptNo ??
                            null,

                        declaredWeight:
                            rawPlatformAthlete.declaredWeight ??
                            null,

                        result:
                            rawPlatformAthlete.result ??
                            "PENDING",

                        completed:
                            rawPlatformAthlete.completed ??
                            false,

                        applicableWeight:
                            rawPlatformAthlete.applicableWeight ??
                            null,
                    },
            }
            : null;


    // =====================================
    // NEXT
    // =====================================

    const nextAthlete =
        queueState?.next ??
        liveCompetition?.nextAthlete ??
        null;


    // =====================================
    // UPCOMING
    // =====================================

    const upcomingAthletes =
        Array.isArray(
            queueState?.upcoming
        )
            ? queueState.upcoming

            : Array.isArray(
                liveCompetition?.upcomingAthletes
            )
                ? liveCompetition.upcomingAthletes

                : [];


    // =====================================
    // NORMAL AUTOMATIC QUEUE
    //
    // Compatibility adapter only.
    // No ordering is calculated here.
    // =====================================

    const rawQueue =
        Array.isArray(
            queueState?.queue
        )
            ? queueState.queue

            : Array.isArray(
                liveCompetition?.queue
            )
                ? liveCompetition.queue

                : [];


    const queue =
        rawQueue.map(
            (athlete) => ({

                ...athlete,

                currentAttempt:
                    athlete.currentAttempt ??
                        (
                            athlete.attemptNo != null ||
                            athlete.phase != null ||
                            athlete.declaredWeight != null
                        )
                        ? {

                            phase:
                                athlete.phase ??
                                null,

                            attemptNo:
                                athlete.attemptNo ??
                                null,

                            declaredWeight:
                                athlete.declaredWeight ??
                                null,

                            result:
                                athlete.result ??
                                "PENDING",

                            completed:
                                athlete.completed ??
                                false,

                            applicableWeight:
                                athlete.applicableWeight ??
                                null,

                        }
                        : null,

            })
        );


    // =====================================
    // CURRENT PHASE
    // =====================================

    const currentPhase =
        queueState?.currentPhase ??
        liveCompetition?.currentPhase ??
        "SNATCH";


    // =====================================
    // STATUS
    // =====================================

    const status =
        queueState?.status ??
        liveCompetition?.status ??
        "READY";


    // =====================================
    // AUTHORITATIVE VERSION
    // =====================================

    const stateVersion =
        queueState?.stateVersion ??
        liveCompetition?.stateVersion ??
        null;


    // =====================================
    // TOTAL ATHLETES
    // =====================================

    const totalAthletes =
        liveCompetition?.totalAthletes ??
        liveCompetition?.athletes?.length ??
        queueState?.totalAthletes ??
        queueState?.queueCount ??
        queue.length;


    // =====================================
    // RESULTS
    //
    // Backend-authoritative competition results.
    //
    // React does NOT determine elimination.
    //
    // The backend already supplies:
    // - eliminated
    // - status
    // - eliminationReason
    //
    // The athletes array is used only as an
    // authoritative-state fallback/merge so
    // those backend fields are not lost if
    // the result projection differs.
    //
    // No calling-order calculation occurs here.
    // =====================================

    const rawCompetitionResults =
        liveCompetition?.competitionResults ??
        liveCompetition?.results ??
        [];


    const authoritativeAthletes =
        Array.isArray(
            liveCompetition?.athletes
        )
            ? liveCompetition.athletes
            : [];


    const authoritativeAthleteMap =
        new Map(

            authoritativeAthletes.map(
                (athlete) => [

                    String(
                        athlete?.entryId ?? ""
                    ),

                    athlete,

                ]
            )

        );


    const competitionResults =
        Array.isArray(
            rawCompetitionResults
        )
            ? rawCompetitionResults.map(
                (athlete) => {

                    if (!athlete) {

                        return athlete;

                    }


                    const authoritativeAthlete =
                        authoritativeAthleteMap.get(

                            String(
                                athlete.entryId ?? ""
                            )

                        );


                    if (!authoritativeAthlete) {

                        return athlete;

                    }


                    return {

                        ...athlete,

                        // =================================
                        // BACKEND-AUTHORITATIVE ELIMINATION
                        // =================================

                        eliminated:
                            authoritativeAthlete.eliminated ??
                            athlete.eliminated ??
                            false,

                        eliminationReason:
                            authoritativeAthlete.eliminationReason ??
                            athlete.eliminationReason ??
                            null,

                        // Preserve authoritative status
                        // when the backend supplied it.
                        status:
                            authoritativeAthlete.status ??
                            athlete.status,

                    };

                }
            )
            : [];


    // =====================================
    // CURRENT CALLING ATTEMPT
    // =====================================

    const currentAttempt =
        currentAthlete?.currentAttempt ??
        null;


    // =====================================
    // PLATFORM ATTEMPT
    // =====================================

    const platformAttempt =
        platformAthlete?.currentAttempt ??
        null;


    // =====================================
    // CORRECT COMPLETED ATTEMPT WEIGHT
    // =====================================

    const handleCorrectCompletedAttemptWeight =
        async ({
            entryId,
            phase,
            attemptNo,
            correctedWeight,
        }) => {

            if (
                !entryId ||
                !phase ||
                !attemptNo
            ) {

                setLiftError(
                    "Completed attempt information is incomplete."
                );

                return false;

            }


            const weight =
                Number(
                    correctedWeight
                );


            if (
                !Number.isFinite(weight) ||
                weight <= 0
            ) {

                setLiftError(
                    "Please enter a valid corrected weight."
                );

                return false;

            }


            const expectedStateVersion =
                Number(
                    stateVersion
                );


            if (
                !Number.isInteger(
                    expectedStateVersion
                ) ||
                expectedStateVersion < 0
            ) {

                setLiftError(
                    "Live competition state version is unavailable. Refresh the Officials Screen."
                );

                return false;

            }


            try {

                setLiftError("");

                setLiftMessage("");


                await apiRequest(

                    "/live-competition/correct-attempt-weight",

                    "PATCH",

                    {

                        entryId,

                        competitionId,

                        gender,

                        phase,

                        attemptNo,

                        correctedWeight:
                            weight,

                        expectedStateVersion,

                    }

                );


                await refreshAuthoritativeState();


                setLiftMessage(
                    `Completed ${phase === "SNATCH"
                        ? "Snatch"
                        : "Clean & Jerk"
                    } attempt ${attemptNo} corrected to ${weight} kg.`
                );


                return true;

            } catch (error) {

                console.error(
                    "Failed to correct completed attempt weight:",
                    error
                );


                setLiftError(
                    error.response
                        ?.data
                        ?.message ||
                    error.message ||
                    "Failed to correct completed attempt weight."
                );


                if (
                    error.response?.status ===
                    409
                ) {

                    await refreshAuthoritativeState();

                }


                return false;

            }

        };


    // =====================================
    // CORRECT COMPLETED ATTEMPT RESULT
    //
    // FEATURE 2
    //
    // GOOD <-> NO_LIFT
    //
    // This does NOT call processLift.
    // =====================================

    const handleCorrectCompletedAttemptResult =
        async ({
            entryId,
            phase,
            attemptNo,
            correctedResult,
        }) => {

            if (
                !entryId ||
                !phase ||
                !attemptNo
            ) {

                setLiftError(
                    "Completed attempt information is incomplete."
                );

                return false;

            }


            if (
                phase !== "SNATCH" &&
                phase !== "CLEAN_JERK"
            ) {

                setLiftError(
                    "Invalid competition phase."
                );

                return false;

            }


            if (
                correctedResult !== "GOOD" &&
                correctedResult !== "NO_LIFT"
            ) {

                setLiftError(
                    "Invalid corrected result."
                );

                return false;

            }


            const expectedStateVersion =
                Number(
                    stateVersion
                );


            if (
                !Number.isInteger(
                    expectedStateVersion
                ) ||
                expectedStateVersion < 0
            ) {

                setLiftError(
                    "Live competition state version is unavailable. Refresh the Officials Screen."
                );

                return false;

            }


            try {

                setCorrectingCompletedAttemptResult(
                    true
                );

                setLiftError("");

                setLiftMessage("");


                await apiRequest(

                    "/live-competition/correct-attempt-result",

                    "PATCH",

                    {

                        entryId,

                        competitionId,

                        gender,

                        phase,

                        attemptNo,

                        correctedResult,

                        expectedStateVersion,

                    }

                );


                await refreshAuthoritativeState();


                setLiftMessage(
                    `Completed ${phase === "SNATCH"
                        ? "Snatch"
                        : "Clean & Jerk"
                    } attempt ${attemptNo} corrected to ${correctedResult === "GOOD"
                        ? "Good Lift"
                        : "No Lift"
                    }.`
                );


                return true;

            } catch (error) {

                console.error(
                    "Failed to correct completed attempt result:",
                    error
                );


                setLiftError(
                    error.response
                        ?.data
                        ?.message ||
                    error.message ||
                    "Failed to correct completed attempt result."
                );


                if (
                    error.response?.status ===
                    409
                ) {

                    await refreshAuthoritativeState();

                }


                return false;

            } finally {

                setCorrectingCompletedAttemptResult(
                    false
                );

            }

        };


    // =====================================
    // LOAD LIVE COMPETITION
    // =====================================

    const loadLiveCompetition =
        useCallback(
            async () => {

                const response =
                    await apiRequest(

                        `/live-competition/` +
                        `${competitionId}/` +
                        `${gender}`,

                        "GET"

                    );


                return response.data;

            },

            [
                competitionId,
                gender,
            ]
        );


    // =====================================
    // LOAD QUEUE
    // =====================================

    const loadQueueState =
        useCallback(
            async () => {

                const response =
                    await apiRequest(

                        `/live-competition/` +
                        `${competitionId}/` +
                        `${gender}/queue`,

                        "GET"

                    );


                return response.data;

            },

            [
                competitionId,
                gender,
            ]
        );


    // =====================================
    // LOAD AUTHORITATIVE STATE
    // =====================================

    const loadAuthoritativeState =
        useCallback(
            async ({
                showLoading = false,
            } = {}) => {

                if (showLoading) {

                    setLoading(true);

                }


                try {

                    const [
                        liveResponse,
                        queueResponse,
                    ] =
                        await Promise.all([

                            loadLiveCompetition(),

                            loadQueueState(),

                        ]);


                    setLiveCompetition(
                        liveResponse
                    );


                    setQueueState(
                        queueResponse
                    );


                    return {

                        live:
                            liveResponse,

                        queue:
                            queueResponse,

                    };

                } finally {

                    if (showLoading) {

                        setLoading(false);

                    }

                }

            },

            [
                loadLiveCompetition,
                loadQueueState,
            ]
        );


    // =====================================
    // INITIAL LOAD
    // =====================================

    useEffect(() => {

        let cancelled = false;


        const load =
            async () => {

                try {

                    setLoading(true);

                    setLiftError("");


                    const state =
                        await loadAuthoritativeState();


                    if (cancelled) {

                        return;

                    }


                    setLiveCompetition(
                        state.live
                    );


                    setQueueState(
                        state.queue
                    );


                    const backendJustCompleted =
                        state.queue
                            ?.justCompleted ??
                        state.live
                            ?.justCompleted ??
                        null;


                    if (
                        backendJustCompleted
                    ) {

                        setJustCompleted(
                            backendJustCompleted
                        );

                    }

                } catch (error) {

                    if (cancelled) {

                        return;

                    }


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

                } finally {

                    if (!cancelled) {

                        setLoading(false);

                    }

                }

            };


        load();


        return () => {

            cancelled = true;

        };

    }, [
        loadAuthoritativeState,
    ]);


    // =====================================
    // POLLING
    // =====================================

    useEffect(() => {

        if (
            loading ||
            !competitionId ||
            !gender
        ) {

            return undefined;

        }


        const interval =
            setInterval(
                async () => {

                    if (
                        startingCompetition ||
                        processingLift ||
                        savingDeclaration ||
                        savingDeclarationEntryId ||
                        savingNextAttemptAllocation ||
                        correctingCompletedAttemptResult
                    ) {

                        return;

                    }


                    try {

                        const state =
                            await loadAuthoritativeState();

const competitionResponse =
    await getCompetitionById(
        competitionId
    );

if (
    competitionResponse?.data
) {

    setCompetition(
        competitionResponse.data
    );

}
                        const backendJustCompleted =
                            state.queue
                                ?.justCompleted ??
                            state.live
                                ?.justCompleted ??
                            null;


                        if (
                            backendJustCompleted
                        ) {

                            setJustCompleted(
                                backendJustCompleted
                            );

                        }

                    } catch (error) {

                        console.error(
                            "Live competition polling failed:",
                            error
                        );

                    }

                },

                3000

            );


        return () => {

            clearInterval(
                interval
            );

        };

    }, [
        competitionId,
        gender,
        loading,
        startingCompetition,
        processingLift,
        savingDeclaration,
        savingDeclarationEntryId,
        savingNextAttemptAllocation,
        correctingCompletedAttemptResult,
        loadAuthoritativeState,
    ]);


    // =====================================
    // REFRESH AUTHORITATIVE STATE
    // =====================================

    const refreshAuthoritativeState =
        useCallback(
            async () => {

                try {

                    return await loadAuthoritativeState();

                } catch (error) {

                    console.error(
                        "Failed to refresh authoritative state:",
                        error
                    );


                    setLiftError(
                        error.response
                            ?.data
                            ?.message ||
                        error.message ||
                        "Failed to refresh live competition state."
                    );


                    return null;

                }

            },

            [
                loadAuthoritativeState,
            ]
        );


    // =====================================
    // CURRENT ATHLETE DECLARATION DISPLAY
    //
    // This remains based on CALLING CURRENT.
    //
    // Declaration correction can therefore
    // legitimately change currentAthlete.
    // =====================================

    useEffect(() => {

        if (!currentAthlete) {

            setDeclaredWeight("");

            return;

        }


        const authoritativeDeclaredWeight =
            currentAthlete.declaredWeight;


        if (
            authoritativeDeclaredWeight != null &&
            Number(
                authoritativeDeclaredWeight
            ) > 0
        ) {

            setDeclaredWeight(
                authoritativeDeclaredWeight
            );

            return;

        }


        const applicableWeight =
            currentAthlete.applicableWeight;


        if (
            applicableWeight != null &&
            Number(
                applicableWeight
            ) > 0
        ) {

            setDeclaredWeight(
                applicableWeight
            );

            return;

        }


        setDeclaredWeight("");

    }, [
        currentAthlete?.entryId,
        currentAthlete?.attemptNo,
        currentAthlete?.declaredWeight,
        currentAthlete?.applicableWeight,
    ]);


    // =====================================
    // NEXT ATTEMPT ALLOCATION INPUT
    // =====================================

    useEffect(() => {

        if (!nextAttemptDeclaration) {

            setNextAttemptDeclaredWeight("");

            return;

        }


        const weight =
            nextAttemptDeclaration?.declaredWeight ??
            nextAttemptDeclaration?.applicableWeight ??
            nextAttemptDeclaration?.weight ??
            null;


        if (
            weight != null &&
            Number(weight) > 0
        ) {

            setNextAttemptDeclaredWeight(
                String(weight)
            );

            return;

        }


        setNextAttemptDeclaredWeight("");

    }, [
        nextAttemptDeclaration?.entryId,
        nextAttemptDeclaration?.phase,
        nextAttemptDeclaration?.attemptNo,
        nextAttemptDeclaration?.declaredWeight,
        nextAttemptDeclaration?.applicableWeight,
        nextAttemptDeclaration?.weight,
    ]);


    // =====================================
    // START COMPETITION
    // =====================================

    const handleStartCompetition =
        async () => {

            if (
                startingCompetition
            ) {

                return;

            }


            const selectedWeightCategories =
                Array.isArray(
                    liveCompetition
                        ?.selectedWeightCategories
                )
                    ? liveCompetition
                        .selectedWeightCategories

                    : Array.isArray(
                        queueState
                            ?.selectedWeightCategories
                    )
                        ? queueState
                            .selectedWeightCategories

                        : [];


            if (
                selectedWeightCategories.length === 0
            ) {

                setLiftError(
                    "No weight categories are configured for this live competition."
                );

                return;

            }


            try {

                setStartingCompetition(
                    true
                );

                setLiftError("");

                setLiftMessage("");


                await apiRequest(

                    `/live-competition/start/` +
                    `${competitionId}/` +
                    `${gender}`,

                    "POST",

                    {
                        sessionName:
                            liveCompetition
                                ?.sessionName ??
                            "",

                        selectedWeightCategories,

                    }

                );


                setJustCompleted(
                    null
                );


                setNextAttemptDeclaration(
                    null
                );


                const state =
                    await refreshAuthoritativeState();


                if (state) {

                    setLiftMessage(
                        "Live competition started. The backend is determining the calling order automatically."
                    );

                }

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
    // SAVE CURRENT CALLING ATHLETE
    // DECLARATION
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


            const expectedStateVersion =
                Number(
                    stateVersion
                );


            if (
                !Number.isInteger(
                    expectedStateVersion
                ) ||
                expectedStateVersion < 0
            ) {

                setLiftError(
                    "Live competition state version is unavailable. Refresh the Officials Screen."
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

                    competitionId,

                    gender,

                    declaredWeight:
                        weight,

                    expectedStateVersion,

                });


                await refreshAuthoritativeState();


                setLiftMessage(
                    "Declaration saved. Calling order recalculated by backend."
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


                if (
                    error.response?.status ===
                    409
                ) {

                    await refreshAuthoritativeState();

                }

            } finally {

                setSavingDeclaration(
                    false
                );

            }

        };


    // =====================================
    // EDIT DECLARATION FOR NORMAL QUEUE
    // =====================================

    const handleEditDeclaration =
        async ({
            entryId,
            declaredWeight:
            newDeclaredWeight,
        }) => {

            if (
                !entryId ||
                savingDeclarationEntryId
            ) {

                return;

            }


            const queuedAthlete =
                queue.find(
                    (item) =>
                        String(
                            item.entryId
                        ) ===
                        String(
                            entryId
                        )
                );


            if (!queuedAthlete) {

                setLiftError(
                    "Athlete not found in the authoritative competition state."
                );

                return;

            }


            const attempt =
                queuedAthlete;


            if (
                attempt.completed ||
                attempt.status === "COMPLETED"
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
                    } declaration cannot be changed while the competition is in the ${currentPhase === "SNATCH"
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


            const expectedStateVersion =
                Number(
                    stateVersion
                );


            if (
                !Number.isInteger(
                    expectedStateVersion
                ) ||
                expectedStateVersion < 0
            ) {

                setLiftError(
                    "Live competition state version is unavailable. Refresh the Officials Screen."
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

                    competitionId,

                    gender,

                    declaredWeight:
                        weight,

                    expectedStateVersion,

                });


                await refreshAuthoritativeState();


                setLiftMessage(
                    `${queuedAthlete.name}'s declaration updated to ${weight} kg.`
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


                if (
                    error.response?.status ===
                    409
                ) {

                    await refreshAuthoritativeState();

                }

            } finally {

                setSavingDeclarationEntryId(
                    null
                );

            }

        };


    // =====================================
    // SAVE NEXT ATTEMPT ALLOCATION
    // =====================================

    const handleSaveNextAttemptAllocation =
        async () => {

            if (
                !nextAttemptDeclaration ||
                savingNextAttemptAllocation
            ) {

                return;

            }


            const entryId =
                nextAttemptDeclaration
                    ?.entryId ??
                null;


            const nextAttempt =
                nextAttemptDeclaration ??
                null;


            if (!entryId) {

                setLiftError(
                    "Unable to identify the completed athlete."
                );

                return;

            }


            if (!nextAttempt) {

                setLiftError(
                    "This athlete has no remaining attempt."
                );

                return;

            }


            const weight =
                Number(
                    nextAttemptDeclaredWeight
                );


            if (
                !Number.isFinite(weight) ||
                weight <= 0
            ) {

                setLiftError(
                    "Please enter a valid next-attempt weight."
                );

                return;

            }


            const expectedStateVersion =
                Number(
                    stateVersion
                );


            if (
                !Number.isInteger(
                    expectedStateVersion
                ) ||
                expectedStateVersion < 0
            ) {

                setLiftError(
                    "Live competition state version is unavailable. Refresh the Officials Screen."
                );

                return;

            }


            try {

                setSavingNextAttemptAllocation(
                    true
                );

                setLiftError("");
                setLiftMessage("");


                await saveDeclaredWeight({

                    entryId,

                    competitionId,

                    gender,

                    declaredWeight:
                        weight,

                    expectedStateVersion,

                });


                setNextAttemptDeclaration(
                    (previous) => {

                        if (!previous) {

                            return previous;

                        }


                        return {

                            ...previous,

                            declaredWeight:
                                weight,

                            applicableWeight:
                                weight,

                        };

                    }
                );


                setJustCompleted((previous) => {

                    if (!previous) {

                        return previous;

                    }


                    const updatedAttempt =
                        previous.completedAthleteNextAttempt
                            ? {
                                ...previous.completedAthleteNextAttempt,
                                declaredWeight: weight,
                                applicableWeight: weight,
                            }
                            : previous.nextAttempt
                                ? {
                                    ...previous.nextAttempt,
                                    declaredWeight: weight,
                                    applicableWeight: weight,
                                }
                                : null;


                    return {

                        ...previous,

                        completedAthleteNextAttempt:
                            updatedAttempt,

                        completedAthleteNextAttemptWeight:
                            weight,

                        nextAttempt:
                            updatedAttempt,

                        nextAttemptWeight:
                            weight,

                        nextAttemptState:
                            previous.nextAttemptState
                                ? {
                                    ...previous.nextAttemptState,
                                    attempt: updatedAttempt,
                                    weight,
                                }
                                : previous.nextAttemptState,

                    };

                });


                await refreshAuthoritativeState();


                setLiftMessage(
                    `${nextAttemptDeclaration?.name ??
                    nextAttemptDeclaration?.athlete?.name ??
                    "Athlete"
                    }'s next attempt allocation saved: ${weight} kg.`
                );

            } catch (error) {

                console.error(
                    "Failed to save next attempt allocation:",
                    error
                );


                setLiftError(
                    error.response
                        ?.data
                        ?.message ||
                    error.message ||
                    "Failed to save next attempt allocation."
                );


                if (
                    error.response?.status ===
                    409
                ) {

                    await refreshAuthoritativeState();

                }

            } finally {

                setSavingNextAttemptAllocation(
                    false
                );

            }

        };


    // =====================================
    // PROCESS LIFT
    //
    // CRITICAL STATE DISTINCTION:
    //
    // currentAthlete:
    //     calling-order current
    //
    // platformAthlete:
    //     physical athlete who performs
    //     the lift
    //
    // Therefore processLift MUST use:
    //
    // platformAthlete.entryId
    //
    // and NOT:
    //
    // currentAthlete.entryId
    // =====================================

    const handleProcessLift =
        async (result) => {

            if (
                !platformAthlete ||
                processingLift
            ) {

                return;

            }


            const expectedStateVersion =
                Number(
                    stateVersion
                );


            if (
                !Number.isInteger(
                    expectedStateVersion
                ) ||
                expectedStateVersion < 0
            ) {

                setLiftError(
                    "Live competition state version is unavailable. Refresh the Officials Screen before processing the lift."
                );

                return;

            }


            // =====================================
            // PRESERVE PHYSICAL ATHLETE
            // =====================================

            const submittedAthlete =
                platformAthlete;


            // =====================================
            // PRESERVE EXACT PLATFORM ATTEMPT
            // =====================================

            const submittedAttempt =
                platformAthlete.currentAttempt
                    ? {
                        ...platformAthlete.currentAttempt,
                    }
                    : {

                        phase:
                            platformAthlete.phase ??
                            currentPhase,

                        attemptNo:
                            platformAthlete.attemptNo ??
                            null,

                        declaredWeight:
                            platformAthlete.declaredWeight ??
                            platformAthlete.applicableWeight ??
                            null,

                        applicableWeight:
                            platformAthlete.applicableWeight ??
                            null,

                        result:
                            platformAthlete.result ??
                            "PENDING",

                        completed:
                            false,

                    };


            try {

                setProcessingLift(
                    true
                );

                setLiftMessage("");

                setLiftError("");


                // =====================================
                // PROCESS PHYSICAL PLATFORM ATHLETE
                // =====================================

                const liftResponse =
                    await processLift({

                        entryId:
                            submittedAthlete.entryId,

                        competitionId,

                        gender,

                        result,

                        expectedStateVersion,

                    });


                // =====================================
                // NORMALIZE PROCESS-LIFT RESPONSE
                //
                // api/axios may return:
                //
                // {
                //     success,
                //     data: {...}
                // }
                //
                // or directly:
                //
                // {...}
                //
                // Use the actual payload object
                // consistently below.
                // =====================================

                console.log(
                    "===== PROCESS LIFT RESPONSE ====="
                );

                console.log(
                    liftResponse
                );


                const liftData =
                    liftResponse?.data ??
                    liftResponse ??
                    null;


                console.log(
                    "===== NORMALIZED LIFT DATA ====="
                );

                console.log(
                    liftData
                );


                console.log(
                    "NEXT ATTEMPT STATE:",
                    liftData?.nextAttemptState
                );


                console.log(
                    "JUST COMPLETED:",
                    liftData?.justCompleted
                );


                console.log(
                    "JUST COMPLETED NEXT ATTEMPT:",
                    liftData
                        ?.justCompleted
                        ?.nextAttempt
                );


                console.log(
                    "JUST COMPLETED NEXT ATTEMPT STATE:",
                    liftData
                        ?.justCompleted
                        ?.nextAttemptState
                );


                // =====================================
                // BACKEND JUST-COMPLETED SNAPSHOT
                // =====================================

                const backendJustCompleted =
                    liftData
                        ?.justCompleted ??
                    null;


                // =====================================
                // COMPLETED ATHLETE
                // =====================================

                const completedAthlete =
                    backendJustCompleted
                        ?.athlete ??
                    submittedAthlete;


                // =====================================
                // COMPLETED ATTEMPT
                // =====================================

                const completedAttempt =
                    backendJustCompleted
                        ?.completedAttempt ??
                    {

                        ...submittedAttempt,

                        result,

                        completed:
                            true,

                    };


                // =====================================
                // COMPLETED ATHLETE NEXT ATTEMPT
                //
                // IMPORTANT:
                //
                // nextAttemptState.attempt =
                // completed athlete's next attempt.
                //
                // liftData.nextAttempt =
                // NEW CURRENT athlete's attempt.
                //
                // These MUST NOT be confused.
                // =====================================

                const nextAttemptState =
                    backendJustCompleted
                        ?.nextAttemptState ??
                    liftData
                        ?.nextAttemptState ??
                    null;


                const completedAthleteNextAttempt =
                    nextAttemptState
                        ?.attempt ??
                    null;


                const completedAthleteNextAttemptWeight =
                    nextAttemptState
                        ?.weight ??
                    completedAthleteNextAttempt
                        ?.declaredWeight ??
                    null;


                // =====================================
                // EXPLICIT NEXT ATTEMPT DECLARATION
                //
                // This is intentionally separate
                // from currentAthlete / platformAthlete
                // / nextAthlete.
                // =====================================

                const nextAttemptDeclarationData =
                    completedAthleteNextAttempt
                        ? {

                            ...completedAthleteNextAttempt,

                            entryId:
                                completedAthleteNextAttempt.entryId ??
                                completedAthlete?.entryId ??
                                submittedAthlete.entryId,

                            name:
                                completedAthleteNextAttempt.name ??
                                completedAthlete?.name ??
                                submittedAthlete.name,

                            lotNumber:
                                completedAthleteNextAttempt.lotNumber ??
                                completedAthlete?.official?.lotNumber ??
                                completedAthlete?.lotNumber ??
                                submittedAthlete.lotNumber ??
                                null,

                            phase:
                                completedAthleteNextAttempt.phase ??
                                nextAttemptState?.attempt?.phase ??
                                null,

                            attemptNo:
                                completedAthleteNextAttempt.attemptNo ??
                                nextAttemptState?.attempt?.attemptNo ??
                                null,

                            declaredWeight:
                                completedAthleteNextAttempt.declaredWeight ??
                                nextAttemptState?.weight ??
                                null,

                            applicableWeight:
                                completedAthleteNextAttempt.applicableWeight ??
                                nextAttemptState?.weight ??
                                null,

                            weight:
                                nextAttemptState?.weight ??
                                completedAthleteNextAttempt.declaredWeight ??
                                null,

                        }
                        : null;


                setNextAttemptDeclaration(
                    nextAttemptDeclarationData
                );


                // =====================================
                // NEW CURRENT ATHLETE
                //
                // IMPORTANT:
                //
                // This is intentionally NOT used
                // as the completed athlete's next
                // declaration.
                // =====================================

                const backendNextAttempt =
                    liftData
                        ?.nextAttempt ??
                    null;


                const backendCurrentEntryId =
                    liftData
                        ?.currentEntryId ??
                    null;


                // =====================================
                // SAVE JUST-COMPLETED SNAPSHOT
                // =====================================

                setJustCompleted({

                    athlete:
                        completedAthlete,

                    completedAttempt:
                        completedAttempt,

                    nextAttempt:
                        completedAthleteNextAttempt,

                    nextAttemptWeight:
                        completedAthleteNextAttemptWeight,

                    completedAthleteNextAttempt:
                        completedAthleteNextAttempt,

                    completedAthleteNextAttemptWeight:
                        completedAthleteNextAttemptWeight,

                    currentAthleteNextAttempt:
                        backendNextAttempt,

                    nextAttemptState:
                        nextAttemptState,

                    backendJustCompleted:
                        backendJustCompleted,

                    previousCurrentEntryId:
                        liftData
                            ?.previousCurrentEntryId ??
                        submittedAthlete.entryId,

                    currentEntryId:
                        backendCurrentEntryId,

                    performedAt:
                        liftData
                            ?.performedAt ??
                        null,

                    performedSequence:
                        liftData
                            ?.performedSequence ??
                        null,

                    stateVersion:
                        liftData
                            ?.stateVersion ??
                        null,

                });


                // =====================================
                // SUCCESSFUL PROCESS-LIFT RESPONSE
                // =====================================
                //
                // Keep immediate state update only
                // when backend actually supplies it.
                // =====================================

                if (
                    backendCurrentEntryId &&
                    liftData?.currentAthlete
                ) {

                    setQueueState(
                        (previous) => ({

                            ...previous,

                            current:
                                liftData
                                    .currentAthlete,

                            platform:
                                liftData
                                    ?.platformAthlete ??
                                liftData
                                    ?.currentAthlete ??
                                null,

                            currentPhase:
                                liftData
                                    .currentAthlete
                                    ?.phase ??
                                liftData
                                    ?.phase ??
                                previous?.currentPhase,

                            stateVersion:
                                liftData
                                    ?.stateVersion ??
                                previous?.stateVersion,

                            next:
                                liftData
                                    ?.nextAthlete ??
                                previous?.next ??
                                null,

                            upcoming:
                                Array.isArray(
                                    liftData?.upcoming
                                )
                                    ? liftData.upcoming
                                    : previous?.upcoming ?? [],

                        })
                    );

                }


                // =====================================
                // AUTHORITATIVE REFRESH
                // =====================================

                await refreshAuthoritativeState();


                // =====================================
                // CLEAR CURRENT DECLARATION INPUT
                // =====================================

                setDeclaredWeight("");


                // =====================================
                // STATUS
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


                if (
                    error.response?.status ===
                    409
                ) {

                    await refreshAuthoritativeState();

                }

            } finally {

                setProcessingLift(
                    false
                );

            }

        };

// =====================================
// DOWNLOAD FINAL RESULT PDF
// =====================================

// =====================================
// DOWNLOAD FINAL RESULT PDF
//
// Separate final-result PDFs are generated
// for U17 and U19.
//
// Backend remains authoritative for:
// - result data
// - elimination state
// - age-category filtering
// - ranking
// =====================================

const handleDownloadFinalResult =
    async (
        ageCategory
    ) => {

        if (
            downloadingFinalResult
        ) {

            return;

        }


        if (
            currentPhase !== "COMPLETED"
        ) {

            setLiftError(
                "Final result PDF is available only after the competition is completed."
            );

            return;

        }


        if (
            ageCategory !== "U17" &&
            ageCategory !== "U19"
        ) {

            setLiftError(
                "Invalid final result age category."
            );

            return;

        }


        try {

            setDownloadingFinalResult(
                ageCategory
            );

            setLiftError("");

            setLiftMessage("");


            await downloadFinalResultPdf(
                competitionId,
                gender,
                ageCategory
            );


            setLiftMessage(
                `${ageCategory === "U17"
                    ? "U-17"
                    : "U-19"
                } final result PDF downloaded successfully.`
            );

        } catch (error) {

            console.error(
                `Failed to download ${ageCategory} final result PDF:`,
                error
            );


            setLiftError(
                error.response
                    ?.data
                    ?.message ||
                error.message ||
                `Failed to download ${ageCategory} final result PDF.`
            );

        } finally {

            setDownloadingFinalResult(
                null
            );

        }

    };

    // =====================================
    // LOADING
    // =====================================

    if (
        loading
    ) {

        return (

            <div
                className="live-score-page"
            >

                <div
                    className="live-score-loading"
                >

                    <h2>
                        Loading Live Competition...
                    </h2>

                </div>

            </div>

        );

    }


    // =====================================
    // STATUS DISPLAY
    // =====================================

    const showStatus =
    Boolean(
        liftMessage ||
        liftError ||
        processingLift ||
        savingDeclaration ||
        startingCompetition ||
        savingDeclarationEntryId ||
        savingNextAttemptAllocation ||
        correctingCompletedAttemptResult ||
        downloadingFinalResult
    );


    // =====================================
    // RENDER
    // =====================================

    return (

        <div
            className="live-score-page"
        >

            <LiveScoreHeader

    competitionName={
        competition?.competitionName ||
        competition?.name ||
        "Competition"
    }

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
                STATUS
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
                        savingDeclaration &&
                        "Saving declaration..."}


                    {!startingCompetition &&
                        !savingDeclaration &&
                        savingDeclarationEntryId &&
                        "Saving athlete declaration..."}


                    {!startingCompetition &&
                        !savingDeclaration &&
                        !savingDeclarationEntryId &&
                        savingNextAttemptAllocation &&
                        "Saving next attempt allocation..."}


                    {!startingCompetition &&
                        !savingDeclaration &&
                        !savingDeclarationEntryId &&
                        !savingNextAttemptAllocation &&
                        correctingCompletedAttemptResult &&
                        "Saving completed attempt result correction..."}


                    {!startingCompetition &&
                        !savingDeclaration &&
                        !savingDeclarationEntryId &&
                        !savingNextAttemptAllocation &&
                        !correctingCompletedAttemptResult &&
                        processingLift &&
                        "Saving lift result..."}

                    {!startingCompetition &&
                        !savingDeclaration &&
                        !savingDeclarationEntryId &&
                        !savingNextAttemptAllocation &&
                        !correctingCompletedAttemptResult &&
                        downloadingFinalResult &&
                        `Generating ${
                            downloadingFinalResult === "U17"
                                ? "U-17"
                                : "U-19"
                        } final result PDF...`}
                    {!startingCompetition &&
                        !savingDeclaration &&
                        !savingDeclarationEntryId &&
                        !savingNextAttemptAllocation &&
                        !correctingCompletedAttemptResult &&
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
                !platformAthlete &&
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
                OFFICIALS CONTROL
            ================================= */}

            <OfficialsControlShell

                currentAthlete={
                    currentAthlete
                }

                platformAthlete={
                    platformAthlete
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

                justCompleted={
                    justCompleted
                }

                nextAttemptDeclaration={
                    nextAttemptDeclaration
                }

                nextAttemptDeclaredWeight={
                    nextAttemptDeclaredWeight
                }

                setNextAttemptDeclaredWeight={
                    setNextAttemptDeclaredWeight
                }

                onSaveNextAttemptAllocation={
                    handleSaveNextAttemptAllocation
                }

                savingNextAttemptAllocation={
                    savingNextAttemptAllocation
                }

                nextAthlete={
                    nextAthlete
                }

                upcomingAthletes={
                    upcomingAthletes
                }

            />
{/* =================================
    FINAL RESULT PDF
================================= */}

{currentPhase === "COMPLETED" && (

    <div className="live-score-final-result">

        <button
            type="button"
            onClick={() =>
                handleDownloadFinalResult(
                    "U17"
                )
            }
            disabled={
                downloadingFinalResult !== null
            }
        >

            {downloadingFinalResult === "U17"
                ? "Generating U-17 Final Result..."
                : "Download U-17 Final Result"}

        </button>


        <button
            type="button"
            onClick={() =>
                handleDownloadFinalResult(
                    "U19"
                )
            }
            disabled={
                downloadingFinalResult !== null
            }
        >

            {downloadingFinalResult === "U19"
                ? "Generating U-19 Final Result..."
                : "Download U-19 Final Result"}

        </button>

    </div>

)}

            {/* =================================
                RESULTS
            ================================= */}

            <CompetitionResults

                competitionResults={
                    competitionResults
                }

                currentAthlete={
                    currentAthlete
                }

                nextAthlete={
                    nextAthlete
                }

                queue={
                    queue
                }

                onEditDeclaration={
                    handleEditDeclaration
                }

                onCorrectCompletedAttemptWeight={
                    handleCorrectCompletedAttemptWeight
                }

                onCorrectCompletedAttemptResult={
                    handleCorrectCompletedAttemptResult
                }

                savingDeclarationEntryId={
                    savingDeclarationEntryId
                }

            />

        </div>

    );

};


export default LiveScore;