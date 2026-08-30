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
// React:
// - displays authoritative state
// - submits official actions
// - keeps the latest successful lift response
//   for the JUST COMPLETED display
//
// React does NOT:
// - calculate calling order
// - select the next athlete
// - reorder athletes
//
// Backend:
// Competition State
// → Queue/State Engine
// → Current / Next / Upcoming
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
    //
    // This is populated from the successful
    // processLift() response.
    //
    // It is NOT inferred from the queue.
    // =====================================

    const [
        justCompleted,
        setJustCompleted,
    ] = useState(null);


    // =====================================
    // NEXT ATTEMPT ALLOCATION
    //
    // UI state for the athlete who just
    // completed an attempt.
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
    // PENDING DECLARATION ACTION
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
    // DERIVED AUTHORITATIVE STATE
    // =====================================

    const rawCurrentAthlete =
        queueState?.current ??
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
    // NEXT
    //
    // Backend authoritative.
    // =====================================

    const nextAthlete =
        queueState?.next ??
        null;


    // =====================================
    // UPCOMING
    //
    // Backend authoritative.
    // =====================================

    const upcomingAthletes =
        Array.isArray(
            queueState?.upcoming
        )
            ? queueState.upcoming
            : [];


    // =====================================
    // NORMAL AUTOMATIC QUEUE
    //
    // IMPORTANT:
    //
    // This is only a compatibility adapter.
    // It does not calculate queue order.
    // =====================================

    const rawQueue =
        Array.isArray(
            queueState?.queue
        )
            ? queueState.queue
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
    // DECLARATION-PENDING ATHLETES
    //
    // Backend supplied only.
    // =====================================

    const declarationPendingCandidates =
        Array.isArray(
            queueState
                ?.declarationPendingCandidates
        )
            ? queueState
                .declarationPendingCandidates
            : [];


    const declarationPending =
        Boolean(
            queueState?.declarationPending ||
            declarationPendingCandidates.length > 0
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
    // =====================================

    const competitionResults =
        liveCompetition?.competitionResults ??
        liveCompetition?.results ??
        [];


    // =====================================
    // CURRENT ATTEMPT
    // =====================================

    const currentAttempt =
        currentAthlete?.currentAttempt ??
        null;


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
    //
    // IMPORTANT:
    //
    // Does NOT calculate anything.
    //
    // It only consumes backend state.
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


                    /*
                     * If the GET response eventually
                     * exposes an authoritative
                     * justCompleted snapshot,
                     * consume it.
                     *
                     * Current backend response does
                     * not expose it, so this remains
                     * null on initial page load.
                     */
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
    //
    // Polling refreshes authoritative
    // competition state.
    //
    // It does NOT erase the latest local
    // successful processLift() result because
    // the current GET contract does not expose
    // justCompleted.
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
    savingNextAttemptAllocation
) {
    return;
}


                    try {

                        const state =
                            await loadAuthoritativeState();


                        /*
                         * If a future backend snapshot
                         * exposes justCompleted, use it.
                         *
                         * Otherwise preserve the latest
                         * successful lift result already
                         * stored locally.
                         */
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
    // IMPORTANT:
    //
    // Do not reset input on every poll.
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
    //
    // Initialize from the backend-provided
    // next attempt. Do not synchronize on
    // every render, otherwise polling can
    // overwrite an official's typing.
    // =====================================

    useEffect(() => {

        if (!justCompleted) {

            setNextAttemptDeclaredWeight("");

            return;

        }


        const weight =
            justCompleted
                ?.completedAthleteNextAttemptWeight;


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
        justCompleted?.entryId,
        justCompleted
            ?.completedAthleteNextAttempt
            ?.phase,
        justCompleted
            ?.completedAthleteNextAttempt
            ?.attemptNo,
        justCompleted
            ?.completedAthleteNextAttemptWeight,
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


                /*
                 * A newly started competition has
                 * no completed lift yet.
                 */
                setJustCompleted(
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
    // SAVE CURRENT ATHLETE DECLARATION
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
                    error.response?.status === 409
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
    // SAVE PENDING DECLARATION
    // =====================================

    const handleSavePendingDeclaration =
        async ({
            entryId,
            weight,
        }) => {

            if (
                !entryId ||
                savingDeclarationEntryId
            ) {

                return;

            }


            const athlete =
                declarationPendingCandidates.find(
                    (candidate) =>
                        String(
                            candidate.entryId
                        ) ===
                        String(
                            entryId
                        )
                );


            if (!athlete) {

                setLiftError(
                    "Athlete is no longer awaiting declaration. Refresh the Officials Screen."
                );

                return;

            }


            if (
                athlete.phase &&
                athlete.phase !== currentPhase
            ) {

                setLiftError(
                    "This athlete's declaration does not belong to the current competition phase."
                );

                return;

            }


            if (
                athlete.completed
            ) {

                setLiftError(
                    "This athlete has already completed the competition."
                );

                return;

            }


            if (
                athlete.result &&
                athlete.result !== "PENDING"
            ) {

                setLiftError(
                    "This attempt has already been completed."
                );

                return;

            }


            const numericWeight =
                Number(
                    weight
                );


            if (
                Number.isNaN(
                    numericWeight
                ) ||
                numericWeight <= 0
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
                        numericWeight,

                    expectedStateVersion,

                });


                await refreshAuthoritativeState();


                setLiftMessage(
                    "Declaration saved. Calling order recalculated by backend."
                );

            } catch (error) {

                console.error(
                    "Failed to save pending declaration:",
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
                    error.response?.status === 409
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

                const pendingAthlete =
                    declarationPendingCandidates.find(
                        (item) =>
                            String(
                                item.entryId
                            ) ===
                            String(
                                entryId
                            )
                    );


                if (
                    pendingAthlete
                ) {

                    await handleSavePendingDeclaration({

                        entryId,

                        weight:
                            newDeclaredWeight,

                    });

                    return;

                }


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
                    error.response?.status === 409
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
    //
    // Saves the next attempt declaration
    // for the athlete who just completed.
    // Queue/calling order remains backend
    // authoritative.
    // =====================================

    const handleSaveNextAttemptAllocation =
        async () => {

            if (
                !justCompleted ||
                savingNextAttemptAllocation
            ) {

                return;

            }


            const entryId =
                justCompleted
                    ?.athlete
                    ?.entryId ??
                justCompleted
                    ?.entryId ??
                null;


            const nextAttempt =
                justCompleted
                    ?.completedAthleteNextAttempt ??
                justCompleted
                    ?.nextAttempt ??
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

                    declaredWeight: weight,

                    expectedStateVersion,

                });


                // Keep the allocation panel immediately
                // consistent with the value just saved.
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


                // Backend remains authoritative.
                await refreshAuthoritativeState();


                setLiftMessage(
                    `${justCompleted?.athlete?.name ??
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
                    error.response?.status === 409
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
// Responsibility:
//
// 1. Submit the currently displayed lift.
// 2. Preserve the athlete/attempt that
//    actually performed the lift.
// 3. Consume the backend-authoritative
//    justCompleted snapshot.
// 4. Preserve the completed athlete's
//    next-attempt allocation separately
//    from the newly assigned current athlete.
// 5. Refresh authoritative competition state.
//
// IMPORTANT:
//
// React does NOT calculate calling order.
// The backend remains authoritative.
// =====================================

const handleProcessLift =
    async (result) => {

        if (
            !currentAthlete ||
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
        // PRESERVE SUBMITTED ATHLETE
        // =====================================

        const submittedAthlete =
            currentAthlete;


        // =====================================
        // PRESERVE EXACT ATTEMPT
        // THAT WAS ON PLATFORM
        // =====================================

        const submittedAttempt =
            currentAthlete.currentAttempt
                ? {
                    ...currentAthlete.currentAttempt,
                }
                : {

                    phase:
                        currentAthlete.phase ??
                        currentPhase,

                    attemptNo:
                        currentAthlete.attemptNo ??
                        null,

                    declaredWeight:
                        currentAthlete.declaredWeight ??
                        currentAthlete.applicableWeight ??
                        null,

                    applicableWeight:
                        currentAthlete.applicableWeight ??
                        null,

                    result:
                        currentAthlete.result ??
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
            // PROCESS LIFT
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
            // BACKEND JUST-COMPLETED SNAPSHOT
            // =====================================

            const backendJustCompleted =
                liftResponse
                    ?.justCompleted ??
                null;


            // =====================================
            // COMPLETED ATHLETE
            //
            // The athlete who was actually
            // on the platform must remain the
            // athlete shown in this panel.
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
            // COMPLETED ATHLETE'S
            // NEXT ATTEMPT STATE
            //
            // IMPORTANT:
            //
            // This is NOT the same thing as
            // the new current athlete's attempt.
            // =====================================

            const nextAttemptState =
                backendJustCompleted
                    ?.nextAttemptState ??
                liftResponse
                    ?.nextAttemptState ??
                null;


            // =====================================
            // COMPLETED ATHLETE'S
            // NEXT ATTEMPT
            // =====================================

            const completedAthleteNextAttempt =
                backendJustCompleted
                    ?.nextAttempt ??
                nextAttemptState
                    ?.attempt ??
                null;


            // =====================================
            // COMPLETED ATHLETE'S
            // NEXT ATTEMPT WEIGHT
            // =====================================

            const completedAthleteNextAttemptWeight =
                nextAttemptState
                    ?.weight ??
                completedAthleteNextAttempt
                    ?.declaredWeight ??
                null;


            // =====================================
            // NEW CURRENT ATHLETE'S ATTEMPT
            //
            // This belongs to automatic
            // advancement, NOT allocation.
            // =====================================

            const backendNextAttempt =
                liftResponse
                    ?.nextAttempt ??
                null;


            // =====================================
            // SAVE LOCAL JUST-COMPLETED SNAPSHOT
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

                // Newly assigned current athlete's
                // attempt, if supplied by backend.
                currentAthleteNextAttempt:
                    backendNextAttempt,

                nextAttemptState:
                    nextAttemptState,

                // Preserve raw backend snapshot.
                backendJustCompleted:
                    backendJustCompleted,

                previousCurrentEntryId:
                    liftResponse
                        ?.previousCurrentEntryId ??
                    submittedAthlete.entryId,

                currentEntryId:
                    liftResponse
                        ?.currentEntryId ??
                    null,

                performedAt:
                    liftResponse
                        ?.performedAt ??
                    null,

                performedSequence:
                    liftResponse
                        ?.performedSequence ??
                    null,

                stateVersion:
                    liftResponse
                        ?.stateVersion ??
                    null,

            });


            // =====================================
            // REFRESH AUTHORITATIVE STATE
            // =====================================

            await refreshAuthoritativeState();


            // =====================================
            // CLEAR CURRENT DECLARATION INPUT
            // =====================================

            setDeclaredWeight("");


            // =====================================
            // STATUS MESSAGE
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


            // =====================================
            // STALE STATE
            // =====================================

            if (
                error.response?.status === 409
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
            savingNextAttemptAllocation
        );


    // =====================================
    // RENDER
    // =====================================

    return (

        <div
            className="live-score-page"
        >

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
                        processingLift &&
                        "Saving lift result..."}


                    {!startingCompetition &&
                        !savingDeclaration &&
                        !savingDeclarationEntryId &&
                        !savingNextAttemptAllocation &&
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
                DECLARATION PENDING
            ================================= */}

            {declarationPending &&
                declarationPendingCandidates.length > 0 && (

                    <section
                        className="declaration-pending-section"
                    >

                        <div
                            className="declaration-pending-header"
                        >

                            <div>

                                <h2>
                                    Declaration Required
                                </h2>

                                <p>
                                    These athletes cannot enter the automatic calling queue until their current attempt has a valid declared weight.
                                </p>

                            </div>


                            <strong>

                                {
                                    declarationPendingCandidates.length
                                }

                                {" "}

                                pending

                            </strong>

                        </div>


                        <div
                            className="declaration-pending-list"
                        >

                            {
                                declarationPendingCandidates.map(
                                    (athlete) => (

                                        <PendingDeclarationRow

                                            key={
                                                athlete.entryId
                                            }

                                            athlete={
                                                athlete
                                            }

                                            currentPhase={
                                                currentPhase
                                            }

                                            saving={
                                                savingDeclarationEntryId ===
                                                athlete.entryId
                                            }

                                            onSave={
                                                handleSavePendingDeclaration
                                            }

                                        />

                                    )
                                )
                            }

                        </div>

                    </section>

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

                queue={
                    queue
                }

                onEditDeclaration={
                    handleEditDeclaration
                }

                savingDeclarationEntryId={
                    savingDeclarationEntryId
                }

            />

        </div>

    );

};


// =====================================
// PENDING DECLARATION ROW
//
// UI only.
// =====================================

const PendingDeclarationRow = ({
    athlete,
    currentPhase,
    saving,
    onSave,
}) => {

    const [
        weight,
        setWeight,
    ] = useState(
        athlete?.declaredWeight ??
        ""
    );


    // =====================================
    // SYNC BACKEND VALUE
    // =====================================

    useEffect(() => {

        if (
            athlete?.declaredWeight != null &&
            Number(
                athlete.declaredWeight
            ) > 0
        ) {

            setWeight(
                athlete.declaredWeight
            );

            return;

        }


        setWeight("");

    }, [
        athlete?.entryId,
        athlete?.declaredWeight,
        athlete?.attemptNo,
    ]);


    // =====================================
    // SUBMIT
    // =====================================

    const handleSubmit =
        async (event) => {

            event.preventDefault();


            await onSave({

                entryId:
                    athlete.entryId,

                weight,

            });

        };


    return (

        <form
            className="declaration-pending-row"
            onSubmit={
                handleSubmit
            }
        >

            <div
                className="declaration-pending-athlete"
            >

                <strong>

                    {
                        athlete.name ??
                        "Unknown athlete"
                    }

                </strong>


                <span>

                    Lot{" "}

                    {
                        athlete.lotNumber ??
                        "—"
                    }

                </span>

            </div>


            <div
                className="declaration-pending-attempt"
            >

                <span>

                    {
                        athlete.phase ===
                            "SNATCH"
                            ? "Snatch"
                            : athlete.phase ===
                                "CLEAN_JERK" ||
                                athlete.phase ===
                                "CLEAN & JERK"
                                ? "Clean & Jerk"
                                : currentPhase
                    }

                </span>


                <span>

                    Attempt{" "}

                    {
                        athlete.attemptNo ??
                        "—"
                    }

                </span>

            </div>


            <div
                className="declaration-pending-input"
            >

                <label>
                    Declared weight
                </label>


                <input

                    type="number"

                    min="1"

                    step="1"

                    value={
                        weight
                    }

                    onChange={
                        (event) =>
                            setWeight(
                                event.target.value
                            )
                    }

                    disabled={
                        saving
                    }

                    required

                />


                <span>
                    kg
                </span>

            </div>


            <button

                type="submit"

                disabled={
                    saving ||
                    !weight
                }

            >

                {
                    saving
                        ? "Saving..."
                        : "Save Declaration"
                }

            </button>

        </form>

    );

};


export default LiveScore;