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
    queue = [],
    onEditDeclaration = null,
    savingDeclarationEntryId = null,
}) => {


    // =====================================
    // LOCAL UI STATE
    // =====================================

    const [
        editingEntryId,
        setEditingEntryId,
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
    // RENDER ATTEMPT
    // =====================================

    const renderAttempt = (
        attempt,
        openingWeight = null
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


        const weight =
            attempt.declaredWeight;


        // =================================
        // PENDING
        // =================================

        if (
            attempt.result === "PENDING"
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
            attempt.result === "GOOD"
        ) {

            return (
                weight != null &&
                Number(weight) > 0
            )
                ? `${weight}`
                : "✓";

        }


        // =================================
        // NO LIFT
        // =================================

        if (
            attempt.result === "NO_LIFT"
        ) {

            if (
                weight != null &&
                Number(weight) > 0
            ) {

                return (

                    <span
                        className="attempt-no-lift"
                    >

                        {weight}

                    </span>

                );

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
    // EDIT
    // =====================================

    const handleEditClick = (athlete) => {

        const attempt =
            getEditableAttempt(
                athlete
            );


        if (!attempt) {

            return;

        }


        // Completed attempt cannot be edited.

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
    // SAVE
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
    // CANCEL
    // =====================================

    const handleCancel = () => {

        setEditingEntryId(null);

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

                            <th>
                                Action
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {
                            competitionResults.map(
                                (athlete) => {

                                    // =================================
                                    // CURRENT ATHLETE
                                    // =================================

                                    const isCurrent =
                                        String(
                                            athlete.entryId
                                        ) ===
                                        String(
                                            currentAthlete?.entryId
                                        );


                                    // =================================
                                    // BACKEND EDITABLE ATTEMPT
                                    // =================================

                                    const editableAttempt =
                                        getEditableAttempt(
                                            athlete
                                        );


                                    // =================================
                                    // EDITING
                                    // =================================

                                    const isEditing =
                                        String(
                                            editingEntryId
                                        ) ===
                                        String(
                                            athlete.entryId
                                        );


                                    // =================================
                                    // SAVING
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
                                    // =================================

                                    const rowClassName =
                                        isCurrent
                                            ? "scoreboard-current-row"
                                            : (
                                                athlete.completed === true ||
                                                athlete.status === "COMPLETED"
                                            )
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

                                                <strong>

                                                    {
                                                        athlete.name ??
                                                        "-"
                                                    }

                                                </strong>


                                                {
                                                    isCurrent && (

                                                        <span
                                                            className="scoreboard-current-badge"
                                                        >

                                                            CURRENT

                                                        </span>

                                                    )
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

                                                        athlete.openingSnatch

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
                                                            ?.[1]

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
                                                            ?.[2]

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

                                                        athlete.openingCleanJerk

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
                                                            ?.[1]

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
                                                            ?.[2]

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


                                            {/* =====================
                                                ACTION
                                            ===================== */}

                                            <td
                                                className={
                                                    isEditing
                                                        ? "scoreboard-action-cell scoreboard-action-cell-editing"
                                                        : "scoreboard-action-cell"
                                                }
                                            >

                                                {
                                                    isEditing &&
                                                    editableAttempt
                                                        ? (

                                                            /*
                                                             * IMPORTANT:
                                                             * The editor is INSIDE
                                                             * this athlete's existing
                                                             * table row.
                                                             *
                                                             * No additional <tr>.
                                                             */

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
                                                        : editableAttempt
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

                                                                    Edit

                                                                </button>

                                                            )
                                                            : (

                                                                <span
                                                                    className="scoreboard-action-empty"
                                                                >

                                                                    —

                                                                </span>

                                                            )
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
                                        colSpan="13"
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

        </section>

    );

};


export default CompetitionResults;