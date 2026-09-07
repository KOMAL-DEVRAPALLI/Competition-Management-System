import {
    useEffect,
    useState,
} from "react";

import "./CompetitionResults.css";


// =====================================
// DECLARATION EDITOR
// =====================================

const DeclarationEditor = ({
    athlete,
    attempt,
    saving,
    onSave,
    onCancel,
}) => {

    const [
        weight,
        setWeight,
    ] = useState("");


    // =====================================
    // INITIALIZE EDITOR
    // =====================================

    useEffect(() => {

        if (
            attempt?.declaredWeight != null &&
            Number(attempt.declaredWeight) > 0
        ) {

            setWeight(
                String(attempt.declaredWeight)
            );

            return;

        }


        if (
            attempt?.applicableWeight != null &&
            Number(attempt.applicableWeight) > 0
        ) {

            setWeight(
                String(attempt.applicableWeight)
            );

            return;

        }


        setWeight("");

    }, [
        athlete?.entryId,
        attempt?.phase,
        attempt?.attemptNo,
        attempt?.declaredWeight,
        attempt?.applicableWeight,
    ]);


    // =====================================
    // SAVE
    // =====================================

    const handleSubmit = async (event) => {

        event.preventDefault();


        if (
            saving ||
            !weight
        ) {

            return;

        }


        const numericWeight =
            Number(weight);


        if (
            !Number.isFinite(numericWeight) ||
            numericWeight <= 0
        ) {

            return;

        }


        await onSave({

            entryId:
                athlete.entryId,

            declaredWeight:
                numericWeight,

        });

    };


    // =====================================
    // PHASE LABEL
    // =====================================

    const phaseLabel =
        attempt?.phase === "CLEAN_JERK"
            ? "CJ"
            : "S";


    return (

        <form
            className="scoreboard-declaration-editor"
            onSubmit={handleSubmit}
        >

            <span
                className="scoreboard-declaration-attempt"
            >
                {phaseLabel}
                {attempt?.attemptNo ?? "-"}
            </span>


            <div
                className="scoreboard-declaration-input-wrapper"
            >

                <input
                    type="number"
                    min="1"
                    step="1"
                    value={weight}
                    onChange={(event) =>
                        setWeight(
                            event.target.value
                        )
                    }
                    disabled={saving}
                    aria-label={
                        `${athlete.name} declaration`
                    }
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
                        ? "..."
                        : "Save"
                }

            </button>


            <button
                type="button"
                className="scoreboard-declaration-cancel"
                onClick={onCancel}
                disabled={saving}
            >

                Cancel

            </button>

        </form>

    );

};


// =====================================
// COMPLETED ATTEMPT WEIGHT EDITOR
//
// Used only for already completed
// attempts.
//
// This does NOT call processLift and
// therefore cannot create/consume an
// additional attempt.
// =====================================

const CompletedAttemptWeightEditor = ({
    athlete,
    attempt,
    saving,
    onSave,
    onCancel,
}) => {

    const [
        weight,
        setWeight,
    ] = useState("");


    // =====================================
    // INITIALIZE EDITOR
    // =====================================

    useEffect(() => {

        if (
            attempt?.declaredWeight != null &&
            Number(attempt.declaredWeight) > 0
        ) {

            setWeight(
                String(attempt.declaredWeight)
            );

            return;

        }


        if (
            attempt?.applicableWeight != null &&
            Number(attempt.applicableWeight) > 0
        ) {

            setWeight(
                String(attempt.applicableWeight)
            );

            return;

        }


        if (
            attempt?.openingWeight != null &&
            Number(attempt.openingWeight) > 0
        ) {

            setWeight(
                String(attempt.openingWeight)
            );

            return;

        }


        setWeight("");

    }, [
        athlete?.entryId,
        attempt?.phase,
        attempt?.attemptNo,
        attempt?.declaredWeight,
        attempt?.applicableWeight,
        attempt?.openingWeight,
    ]);


    // =====================================
    // SAVE
    // =====================================

    const handleSubmit = async (event) => {

        event.preventDefault();


        if (
            saving ||
            !weight
        ) {

            return;

        }


        const numericWeight =
            Number(weight);


        if (
            !Number.isFinite(numericWeight) ||
            numericWeight <= 0
        ) {

            return;

        }


        await onSave({

            entryId:
                athlete?.entryId,

            phase:
                attempt?.phase,

            attemptNo:
                Number(attempt?.attemptNo),

            correctedWeight:
                numericWeight,

        });

    };


    // =====================================
    // PHASE LABEL
    // =====================================

    const phaseLabel =
        attempt?.phase === "CLEAN_JERK"
            ? "CJ"
            : "S";


    return (

        <form
            className="scoreboard-declaration-editor"
            onSubmit={handleSubmit}
        >

            <span
                className="scoreboard-declaration-attempt"
            >
                {phaseLabel}
                {attempt?.attemptNo ?? "-"}
            </span>


            <div
                className="scoreboard-declaration-input-wrapper"
            >

                <input
                    type="number"
                    min="1"
                    step="1"
                    value={weight}
                    onChange={(event) =>
                        setWeight(
                            event.target.value
                        )
                    }
                    disabled={saving}
                    aria-label={
                        `${athlete.name} ${phaseLabel}${attempt?.attemptNo ?? ""} corrected weight`
                    }
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
                        ? "..."
                        : "Save"
                }

            </button>


            <button
                type="button"
                className="scoreboard-declaration-cancel"
                onClick={onCancel}
                disabled={saving}
            >

                Cancel

            </button>

        </form>

    );

};


// =====================================
// COMPETITION RESULTS
//
// DISPLAY / UI ONLY.
//
// Calling order remains backend
// authoritative.
// =====================================

const CompetitionResults = ({
    competitionResults = [],
    currentAthlete = null,
    nextAthlete = null,
    queue = [],
    onEditDeclaration = null,
    onCorrectCompletedAttemptWeight = null,
    onCorrectCompletedAttemptResult = null,
    savingDeclarationEntryId = null,
}) => {


    // =====================================
    // LOCAL UI STATE
    // =====================================

    const [
        editingEntryId,
        setEditingEntryId,
    ] = useState(null);


    const [
        selectedCompletedAttempt,
        setSelectedCompletedAttempt,
    ] = useState(null);


    const [
        editingCompletedAttemptKey,
        setEditingCompletedAttemptKey,
    ] = useState(null);


    const [
        savingCompletedAttemptKey,
        setSavingCompletedAttemptKey,
    ] = useState(null);


    // =====================================
    // FEATURE 2
    // COMPLETED ATTEMPT RESULT CORRECTION
    // =====================================

    const [
        savingCompletedAttemptResultKey,
        setSavingCompletedAttemptResultKey,
    ] = useState(null);


    // =====================================
    // FIND BACKEND QUEUE ENTRY
    //
    // Lookup only.
    // No calling-order calculation.
    // =====================================

    const getQueueEntry = (entryId) => {

        if (
            !entryId ||
            !Array.isArray(queue)
        ) {

            return null;

        }


        return (
            queue.find(
                (item) =>
                    String(item.entryId) ===
                    String(entryId)
            ) ?? null
        );

    };


    // =====================================
    // GET EDITABLE ATTEMPT
    //
    // Uses only backend-provided state.
    // =====================================

    const getEditableAttempt = (athlete) => {

        const queueEntry =
            getQueueEntry(
                athlete?.entryId
            );


        if (!queueEntry) {

            return null;

        }


        // =================================
        // PREFERRED BACKEND STRUCTURE
        // =================================

        if (
            queueEntry.currentAttempt
        ) {

            return {

                ...queueEntry.currentAttempt,

                phase:
                    queueEntry.currentAttempt.phase ??
                    queueEntry.phase ??
                    null,

                attemptNo:
                    queueEntry.currentAttempt.attemptNo ??
                    queueEntry.attemptNo ??
                    null,

                declaredWeight:
                    queueEntry.currentAttempt.declaredWeight ??
                    queueEntry.declaredWeight ??
                    null,

                applicableWeight:
                    queueEntry.currentAttempt.applicableWeight ??
                    queueEntry.applicableWeight ??
                    null,

                result:
                    queueEntry.currentAttempt.result ??
                    queueEntry.result ??
                    "PENDING",

                completed:
                    queueEntry.currentAttempt.completed ??
                    queueEntry.completed ??
                    false,

            };

        }


        // =================================
        // DIRECT BACKEND QUEUE FIELDS
        // =================================

        if (
            queueEntry.attemptNo != null ||
            queueEntry.phase != null ||
            queueEntry.declaredWeight != null
        ) {

            return {

                phase:
                    queueEntry.phase ??
                    null,

                attemptNo:
                    queueEntry.attemptNo ??
                    null,

                declaredWeight:
                    queueEntry.declaredWeight ??
                    null,

                applicableWeight:
                    queueEntry.applicableWeight ??
                    null,

                result:
                    queueEntry.result ??
                    "PENDING",

                completed:
                    queueEntry.completed ??
                    false,

            };

        }


        return null;

    };


    // =====================================
    // GET COMPLETED ATTEMPTS
    //
    // Read-only extraction from the
    // authoritative CompetitionResults data.
    //
    // No ordering is calculated here.
    // =====================================

    const getCompletedAttempts = (athlete) => {

        const completedAttempts = [];


        const snatchAttempts =
            Array.isArray(
                athlete?.snatchAttempts
            )
                ? athlete.snatchAttempts
                : [];


        snatchAttempts.forEach(
            (attempt, index) => {

                if (
                    !attempt
                ) {

                    return;

                }


                const result =
                    attempt.result ??
                    "PENDING";


                if (
                    result !== "GOOD" &&
                    result !== "NO_LIFT"
                ) {

                    return;

                }


                completedAttempts.push({

                    ...attempt,

                    phase:
                        "SNATCH",

                    attemptNo:
                        attempt.attemptNo ??
                        index + 1,

                    openingWeight:
                        index === 0
                            ? athlete.openingSnatch ??
                                null
                            : null,

                });

            }
        );


        const cleanJerkAttempts =
            Array.isArray(
                athlete?.cleanJerkAttempts
            )
                ? athlete.cleanJerkAttempts
                : [];


        cleanJerkAttempts.forEach(
            (attempt, index) => {

                if (
                    !attempt
                ) {

                    return;

                }


                const result =
                    attempt.result ??
                    "PENDING";


                if (
                    result !== "GOOD" &&
                    result !== "NO_LIFT"
                ) {

                    return;

                }


                completedAttempts.push({

                    ...attempt,

                    phase:
                        "CLEAN_JERK",

                    attemptNo:
                        attempt.attemptNo ??
                        index + 1,

                    openingWeight:
                        index === 0
                            ? athlete.openingCleanJerk ??
                                null
                            : null,

                });

            }
        );


        return completedAttempts;

    };


    // =====================================
    // COMPLETED ATTEMPT KEY
    // =====================================

    const getCompletedAttemptKey = (
        athlete,
        attempt
    ) => {

        return (
            `${athlete?.entryId ?? ""}-` +
            `${attempt?.phase ?? ""}-` +
            `${attempt?.attemptNo ?? ""}`
        );

    };


    // =====================================
    // RENDER ATTEMPT
    // =====================================

    const renderAttempt = (
        attempt,
        openingWeight = null,
        athlete = null,
        phase = null
    ) => {

        if (!attempt) {

            if (
                openingWeight != null &&
                Number(openingWeight) > 0
            ) {

                return `${openingWeight}`;

            }

            return "-";

        }


        // =================================
        // NORMALIZE ATTEMPT PHASE
        //
        // Raw CompetitionEntry attempts
        // do not necessarily contain phase.
        // The table provides the authoritative
        // phase for this attempt column.
        // =================================

        const normalizedAttempt = {

            ...attempt,

            phase:
                attempt.phase ??
                phase,

        };


        const weight =
            normalizedAttempt.declaredWeight;


        // =================================
        // PENDING
        // =================================

        if (
            normalizedAttempt.result === "PENDING"
        ) {

            return (
                weight != null &&
                Number(weight) > 0
            )
                ? `${weight}`
                : "-";

        }


        // =================================
        // GOOD LIFT
        // =================================

        if (
            normalizedAttempt.result === "GOOD"
        ) {

            if (
                weight != null &&
                Number(weight) > 0
            ) {

                const content = (
                    <span className="attempt-good">
                        {weight}
                    </span>
                );


                if (athlete?.entryId) {

                    return (
                        <button
                            type="button"
                            className="scoreboard-attempt-button"
                            onClick={() =>
                                handleEditCompletedAttemptClick(
                                    athlete,
                                    normalizedAttempt
                                )
                            }
                            title="Open completed attempt actions"
                        >
                            {content}
                        </button>
                    );

                }


                return content;

            }

            return (
                <span className="attempt-good">
                    ✓
                </span>
            );

        }


        // =================================
        // NO LIFT
        // =================================

        if (
            normalizedAttempt.result === "NO_LIFT"
        ) {

            if (
                weight != null &&
                Number(weight) > 0
            ) {

                const content = (
                    <span
                        className="attempt-no-lift"
                    >

                        {weight}

                    </span>
                );


                if (athlete?.entryId) {

                    return (
                        <button
                            type="button"
                            className="scoreboard-attempt-button"
                            onClick={() =>
                                handleEditCompletedAttemptClick(
                                    athlete,
                                    normalizedAttempt
                                )
                            }
                            title="Open completed attempt actions"
                        >
                            {content}
                        </button>
                    );

                }


                return content;

            }

            return "X";

        }


        // =================================
        // UNKNOWN / OTHER
        // =================================

        return (
            weight != null &&
            Number(weight) > 0
        )
            ? `${weight}`
            : "-";

    };


    // =====================================
    // EDIT PENDING DECLARATION
    // =====================================

    const handleEditClick = (athlete) => {

        // Eliminated athletes cannot receive
        // a new pending declaration.

        if (
            athlete?.eliminated === true ||
            athlete?.status === "ELIMINATED"
        ) {

            return;

        }


        const attempt =
            getEditableAttempt(
                athlete
            );


        if (!attempt) {

            return;

        }


        // Completed attempt cannot be edited
        // through the normal declaration flow.

        if (
            attempt.completed ||
            athlete.completed === true ||
            athlete.status === "COMPLETED"
        ) {

            return;

        }


        // Only pending declaration may be edited.

        if (
            attempt.result &&
            attempt.result !== "PENDING"
        ) {

            return;

        }


        setEditingCompletedAttemptKey(null);


        setEditingEntryId(
            (current) => {

                if (
                    String(current) ===
                    String(athlete.entryId)
                ) {

                    return null;

                }


                return athlete.entryId;

            }
        );

    };


    // =====================================
    // EDIT COMPLETED ATTEMPT
    // =====================================

    const handleEditCompletedAttemptClick = (
        athlete,
        attempt
    ) => {

        if (
            (
                !onCorrectCompletedAttemptWeight &&
                !onCorrectCompletedAttemptResult
            ) ||
            !athlete ||
            !attempt
        ) {

            return;

        }


        if (
            attempt.result !== "GOOD" &&
            attempt.result !== "NO_LIFT"
        ) {

            return;

        }


        // =================================
        // PHASE MUST BE EXPLICIT
        // =================================

        const phase =
            attempt.phase ?? null;


        if (
            phase !== "SNATCH" &&
            phase !== "CLEAN_JERK"
        ) {

            return;

        }


        const normalizedAttempt = {

            ...attempt,

            phase,

        };


        const key =
            getCompletedAttemptKey(
                athlete,
                normalizedAttempt
            );


        setEditingEntryId(null);

        setEditingCompletedAttemptKey(null);

        setSelectedCompletedAttempt({

            athlete,

            attempt:
                normalizedAttempt,

            key,

        });

    };


    // =====================================
    // START COMPLETED ATTEMPT WEIGHT EDIT
    // =====================================

    const handleStartCompletedAttemptWeightEdit = () => {

        if (!selectedCompletedAttempt) {

            return;

        }


        setEditingCompletedAttemptKey(
            selectedCompletedAttempt.key
        );

    };


    // =====================================
    // CLOSE COMPLETED ATTEMPT PANEL
    // =====================================

    const handleCloseCompletedAttemptPanel = () => {

        if (
            savingCompletedAttemptKey ||
            savingCompletedAttemptResultKey
        ) {

            return;

        }


        setEditingCompletedAttemptKey(null);

        setSelectedCompletedAttempt(null);

    };


    // =====================================
    // SAVE PENDING DECLARATION
    // =====================================

    const handleSave = async (payload) => {

        if (!onEditDeclaration) {

            return;

        }


        await onEditDeclaration(
            payload
        );


        setEditingEntryId(null);

    };


    // =====================================
    // SAVE COMPLETED ATTEMPT WEIGHT
    // =====================================

    const handleSaveCompletedAttempt = async (
        payload
    ) => {

        if (
            !onCorrectCompletedAttemptWeight
        ) {

            return;

        }


        const key =
            getCompletedAttemptKey(
                {
                    entryId:
                        payload.entryId,
                },
                payload
            );


        setSavingCompletedAttemptKey(
            key
        );


        try {

            const success =
                await onCorrectCompletedAttemptWeight(
                    payload
                );


            if (
                success !== false
            ) {

                setEditingCompletedAttemptKey(
                    null
                );

                setSelectedCompletedAttempt(
                    null
                );

            }

        } finally {

            setSavingCompletedAttemptKey(
                null
            );

        }

    };


    // =====================================
    // SAVE COMPLETED ATTEMPT RESULT
    // =====================================

    const handleSaveCompletedAttemptResult = async (
        correctedResult
    ) => {

        if (
            !onCorrectCompletedAttemptResult ||
            !selectedCompletedAttempt
        ) {

            return;

        }


        const {
            athlete,
            attempt,
            key,
        } = selectedCompletedAttempt;


        if (
            !athlete?.entryId ||
            !attempt?.phase ||
            !attempt?.attemptNo
        ) {

            return;

        }


        if (
            attempt.result !== "GOOD" &&
            attempt.result !== "NO_LIFT"
        ) {

            return;

        }


        if (
            correctedResult !== "GOOD" &&
            correctedResult !== "NO_LIFT"
        ) {

            return;

        }


        if (
            correctedResult ===
            attempt.result
        ) {

            return;

        }


        setSavingCompletedAttemptResultKey(
            key
        );


        try {

            const success =
                await onCorrectCompletedAttemptResult({

                    entryId:
                        athlete.entryId,

                    phase:
                        attempt.phase,

                    attemptNo:
                        Number(
                            attempt.attemptNo
                        ),

                    correctedResult,

                });


            if (
                success !== false
            ) {

                setEditingCompletedAttemptKey(
                    null
                );

                setSelectedCompletedAttempt(
                    null
                );

            }

        } finally {

            setSavingCompletedAttemptResultKey(
                null
            );

        }

    };


    // =====================================
    // CANCEL PENDING DECLARATION
    // =====================================

    const handleCancel = () => {

        setEditingEntryId(null);

    };


    // =====================================
    // CANCEL COMPLETED ATTEMPT
    // =====================================

    const handleCompletedAttemptCancel = () => {

        setEditingCompletedAttemptKey(null);

    };


    // =====================================
    // RENDER
    // =====================================

    return (

        <section className="scoreboard">

            {/* =================================
                HEADER
            ================================= */}

            <div className="scoreboard-header">

                <div>

                    <h2>
                        All Athletes / Live Score Sheet
                    </h2>

                    <span className="scoreboard-athlete-count">

                        {competitionResults.length}
                        {" "}
                        athletes

                    </span>

                </div>

            </div>




            {/* =================================
                TABLE
            ================================= */}

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

                        {
                            competitionResults.map(
                                (athlete) => {

                                    // =================================
                                    // ELIMINATED ATHLETE
                                    //
                                    // Backend authoritative state.
                                    // Must take priority over current,
                                    // next, and completed styling.
                                    // =================================

                                    const isEliminated =
                                        athlete?.eliminated === true ||
                                        athlete?.status === "ELIMINATED";


                                    // =================================
                                    // CURRENT ATHLETE
                                    // =================================

                                    const isCurrent =
                                        Boolean(
                                            currentAthlete?.entryId
                                        ) &&
                                        String(
                                            athlete.entryId
                                        ) ===
                                        String(
                                            currentAthlete.entryId
                                        );


                                    // =================================
                                    // NEXT ATHLETE
                                    //
                                    // Backend-provided only.
                                    // No queue calculation here.
                                    // =================================

                                    const isNext =
                                        Boolean(
                                            nextAthlete?.entryId
                                        ) &&
                                        String(
                                            athlete.entryId
                                        ) ===
                                        String(
                                            nextAthlete.entryId
                                        );


                                    // =================================
                                    // COMPLETED
                                    // =================================

                                    const isCompleted =
                                        athlete.completed === true ||
                                        athlete.status === "COMPLETED";


                                    // =================================
                                    // BACKEND EDITABLE ATTEMPT
                                    // =================================

                                    const editableAttempt =
                                        getEditableAttempt(
                                            athlete
                                        );


                                    // =================================
                                    // COMPLETED ATTEMPTS
                                    // =================================

                                    const completedAttempts =
                                        getCompletedAttempts(
                                            athlete
                                        );


                                    // =================================
                                    // PENDING DECLARATION EDITING
                                    // =================================

                                    const isEditing =
                                        String(
                                            editingEntryId
                                        ) ===
                                        String(
                                            athlete.entryId
                                        );


                                    // =================================
                                    // PENDING DECLARATION SAVING
                                    // =================================

                                    const isSaving =
                                        String(
                                            savingDeclarationEntryId
                                        ) ===
                                        String(
                                            athlete.entryId
                                        );


                                    // =================================
                                    // ROW CLASS
                                    //
                                    // Presentation only.
                                    // Calling order is NOT calculated.
                                    //
                                    // ELIMINATED MUST BE FIRST.
                                    // =================================

                                    const rowClassName =
                                        isEliminated
                                            ? "scoreboard-eliminated-row"

                                            : isCurrent
                                                ? "scoreboard-current-row"

                                                : isNext
                                                    ? "scoreboard-next-row"

                                                    : isCompleted
                                                        ? "scoreboard-completed-row"

                                                        : "";


                                    return (

                                        <tr
                                            key={
                                                athlete.entryId
                                            }
                                            className={
                                                rowClassName
                                            }
                                        >

                                            {/* =====================
                                                LOT
                                            ===================== */}

                                            <td>

                                                {
                                                    athlete.lotNumber ??
                                                    "-"
                                                }

                                            </td>


                                            {/* =====================
                                                NAME
                                            ===================== */}

                                            <td>

                                                <div className="scoreboard-athlete-name">

                                                    <strong>

                                                        {
                                                            athlete.name ??
                                                            "-"
                                                        }

                                                    </strong>


                                                    {
                                                        isEliminated && (

                                                            <span
                                                                className="scoreboard-eliminated-badge"
                                                            >

                                                                ELIMINATED

                                                            </span>

                                                        )
                                                    }


                                                    {
                                                        isCurrent &&
                                                        !isEliminated && (

                                                            <span
                                                                className="scoreboard-current-badge"
                                                            >

                                                                CURRENT

                                                            </span>

                                                        )
                                                    }


                                                    {
                                                        isNext &&
                                                        !isCurrent &&
                                                        !isEliminated && (

                                                            <span
                                                                className="scoreboard-next-badge"
                                                            >

                                                                NEXT

                                                            </span>

                                                        )
                                                    }

                                                </div>


                                                {
                                                    isEliminated && (

                                                        <div className="scoreboard-elimination-reason">

                                                            {
                                                                athlete.eliminationReason ===
                                                                "SNATCH_BOMB_OUT"
                                                                    ? "3 NO LIFTS — NO TOTAL"
                                                                    : "ELIMINATED"
                                                            }

                                                        </div>

                                                    )
                                                }


                                                {/* =================================
                                                    NORMAL PENDING DECLARATION EDIT
                                                ================================= */}

                                                {
                                                    !isEliminated &&
                                                    isEditing &&
                                                    editableAttempt
                                                        ? (

                                                            <DeclarationEditor

                                                                athlete={
                                                                    athlete
                                                                }

                                                                attempt={
                                                                    editableAttempt
                                                                }

                                                                saving={
                                                                    isSaving
                                                                }

                                                                onSave={
                                                                    handleSave
                                                                }

                                                                onCancel={
                                                                    handleCancel
                                                                }

                                                            />

                                                        )
                                                        : !isEliminated &&
                                                          editableAttempt
                                                            ? (

                                                                <button
                                                                    type="button"
                                                                    className="scoreboard-edit-declaration"
                                                                    onClick={() =>
                                                                        handleEditClick(
                                                                            athlete
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isSaving
                                                                    }
                                                                >

                                                                    Edit Declaration

                                                                </button>

                                                            )
                                                            : null
                                                }

                                            </td>


                                            {/* =====================
                                                S1
                                            ===================== */}

                                            <td>

                                                {
                                                    renderAttempt(

                                                        athlete
                                                            .snatchAttempts
                                                            ?.[0],

                                                        athlete.openingSnatch,

                                                        athlete,

                                                        "SNATCH"

                                                    )
                                                }

                                            </td>


                                            {/* =====================
                                                S2
                                            ===================== */}

                                            <td>

                                                {
                                                    renderAttempt(

                                                        athlete
                                                            .snatchAttempts
                                                            ?.[1],

                                                        null,

                                                        athlete,

                                                        "SNATCH"

                                                    )
                                                }

                                            </td>


                                            {/* =====================
                                                S3
                                            ===================== */}

                                            <td>

                                                {
                                                    renderAttempt(

                                                        athlete
                                                            .snatchAttempts
                                                            ?.[2],

                                                        null,

                                                        athlete,

                                                        "SNATCH"

                                                    )
                                                }

                                            </td>


                                            {/* =====================
                                                CJ1
                                            ===================== */}

                                            <td>

                                                {
                                                    renderAttempt(

                                                        athlete
                                                            .cleanJerkAttempts
                                                            ?.[0],

                                                        athlete.openingCleanJerk,

                                                        athlete,

                                                        "CLEAN_JERK"

                                                    )
                                                }

                                            </td>


                                            {/* =====================
                                                CJ2
                                            ===================== */}

                                            <td>

                                                {
                                                    renderAttempt(

                                                        athlete
                                                            .cleanJerkAttempts
                                                            ?.[1],

                                                        null,

                                                        athlete,

                                                        "CLEAN_JERK"

                                                    )
                                                }

                                            </td>


                                            {/* =====================
                                                CJ3
                                            ===================== */}

                                            <td>

                                                {
                                                    renderAttempt(

                                                        athlete
                                                            .cleanJerkAttempts
                                                            ?.[2],

                                                        null,

                                                        athlete,

                                                        "CLEAN_JERK"

                                                    )
                                                }

                                            </td>


                                            {/* =====================
                                                BEST SNATCH
                                            ===================== */}

                                            <td>

                                                <strong>

                                                    {
                                                        athlete.bestSnatch ??
                                                        0
                                                    }

                                                </strong>

                                            </td>


                                            {/* =====================
                                                BEST CLEAN & JERK
                                            ===================== */}

                                            <td>

                                                <strong>

                                                    {
                                                        athlete.bestCleanJerk ??
                                                        0
                                                    }

                                                </strong>

                                            </td>


                                            {/* =====================
                                                TOTAL
                                            ===================== */}

                                            <td>

                                                <strong>

                                                    {
                                                        athlete.total ??
                                                        0
                                                    }

                                                </strong>

                                            </td>


                                            {/* =====================
                                                RANK
                                            ===================== */}

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
                            )
                        }


                        {/* =================================
                            EMPTY STATE
                        ================================= */}

                        {
                            !competitionResults.length && (

                                <tr>

                                    <td
                                        colSpan="12"
                                        className="no-scoreboard-data"
                                    >

                                        No scoreboard data available.

                                    </td>

                                </tr>

                            )
                        }

                    </tbody>

                </table>

            </div>


            {/* =================================
                COMPLETED ATTEMPT ACTION PANEL
            ================================= */}

            {
                selectedCompletedAttempt && (

                    <div
                        className="scoreboard-attempt-panel-backdrop"
                        onMouseDown={handleCloseCompletedAttemptPanel}
                    >

                        <aside
                            className="scoreboard-attempt-panel"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Completed attempt actions"
                            onMouseDown={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <div className="scoreboard-attempt-panel-header">

                                <div>

                                    <span className="scoreboard-attempt-panel-eyebrow">
                                        COMPLETED ATTEMPT
                                    </span>

                                    <h3>
                                        {
                                            selectedCompletedAttempt.athlete.name ??
                                            "-"
                                        }
                                    </h3>

                                    <span className="scoreboard-attempt-panel-meta">
                                        Lot {
                                            selectedCompletedAttempt.athlete.lotNumber ??
                                            "-"
                                        }
                                        {" · "}
                                        {
                                            selectedCompletedAttempt.attempt.phase ===
                                            "CLEAN_JERK"
                                                ? "Clean & Jerk"
                                                : "Snatch"
                                        }
                                        {" · Attempt "}
                                        {
                                            selectedCompletedAttempt.attempt.attemptNo ??
                                            "-"
                                        }
                                    </span>

                                </div>

                                <button
                                    type="button"
                                    className="scoreboard-attempt-panel-close"
                                    onClick={handleCloseCompletedAttemptPanel}
                                    disabled={
                                        Boolean(
                                            savingCompletedAttemptKey
                                        ) ||
                                        Boolean(
                                            savingCompletedAttemptResultKey
                                        )
                                    }
                                    aria-label="Close"
                                >
                                    ×
                                </button>

                            </div>


                            <div className="scoreboard-attempt-panel-summary">

                                <div>
                                    <span>Recorded weight</span>
                                    <strong>
                                        {
                                            selectedCompletedAttempt.attempt.declaredWeight ??
                                            selectedCompletedAttempt.attempt.applicableWeight ??
                                            "-"
                                        }
                                        {" kg"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Result</span>
                                    <strong
                                        className={
                                            selectedCompletedAttempt.attempt.result === "GOOD"
                                                ? "attempt-good"
                                                : "attempt-no-lift"
                                        }
                                    >
                                        {
                                            selectedCompletedAttempt.attempt.result === "GOOD"
                                                ? "GOOD LIFT"
                                                : "NO LIFT"
                                        }
                                    </strong>
                                </div>

                            </div>


                            <div className="scoreboard-attempt-panel-actions">

                                {
                                    editingCompletedAttemptKey ===
                                    selectedCompletedAttempt.key
                                        ? (

                                            <CompletedAttemptWeightEditor
                                                athlete={
                                                    selectedCompletedAttempt.athlete
                                                }
                                                attempt={
                                                    selectedCompletedAttempt.attempt
                                                }
                                                saving={
                                                    savingCompletedAttemptKey ===
                                                    selectedCompletedAttempt.key
                                                }
                                                onSave={
                                                    handleSaveCompletedAttempt
                                                }
                                                onCancel={
                                                    handleCompletedAttemptCancel
                                                }
                                            />

                                        )
                                        : (

                                            <>
                                                <button
                                                    type="button"
                                                    className="scoreboard-attempt-primary-action"
                                                    onClick={
                                                        handleStartCompletedAttemptWeightEdit
                                                    }
                                                    disabled={
                                                        Boolean(
                                                            savingCompletedAttemptResultKey
                                                        )
                                                    }
                                                >
                                                    Correct Weight
                                                </button>


                                                {
                                                    onCorrectCompletedAttemptResult &&
                                                    (

                                                        <button
                                                            type="button"
                                                            className="scoreboard-attempt-primary-action"
                                                            onClick={() =>
                                                                handleSaveCompletedAttemptResult(
                                                                    selectedCompletedAttempt.attempt.result ===
                                                                    "GOOD"
                                                                        ? "NO_LIFT"
                                                                        : "GOOD"
                                                                )
                                                            }
                                                            disabled={
                                                                Boolean(
                                                                    savingCompletedAttemptResultKey
                                                                )
                                                            }
                                                        >

                                                            {
                                                                savingCompletedAttemptResultKey ===
                                                                selectedCompletedAttempt.key
                                                                    ? "..."
                                                                    : selectedCompletedAttempt.attempt.result ===
                                                                      "GOOD"
                                                                        ? "Correct to No Lift"
                                                                        : "Correct to Good Lift"
                                                            }

                                                        </button>

                                                    )
                                                }

                                            </>

                                        )
                                }

                            </div>


                            <p className="scoreboard-attempt-panel-note">
                                Corrections are validated by the backend. The original
                                attempt result and execution sequence are preserved.
                            </p>

                        </aside>

                    </div>

                )
            }

        </section>

    );

};


export default CompetitionResults;