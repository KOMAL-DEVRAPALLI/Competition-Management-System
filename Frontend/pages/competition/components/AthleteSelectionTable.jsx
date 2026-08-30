import { useState } from "react";

import "./AthleteSelectionTable.css";


const AthleteSelectionTable = ({
    athletes = [],

    currentAthlete = null,

    nextAthlete = null,

    upcomingAthletes = [],

    currentPhase = "SNATCH",

    onEditDeclaration,

    savingDeclarationEntryId = null,
}) => {

    // =====================================
    // LOCAL EDIT STATE
    //
    // This is UI-only state.
    //
    // It does NOT represent competition
    // authority.
    // =====================================

    const [editingEntryId, setEditingEntryId] =
        useState(null);

    const [editingWeight, setEditingWeight] =
        useState("");


    // =====================================
    // NORMALIZE ENTRY ID
    // =====================================

    const sameEntry = (
        first,
        second
    ) => {

        if (
            !first ||
            !second
        ) {

            return false;

        }


        return (
            first.entryId?.toString() ===
            second.entryId?.toString()
        );

    };


    // =====================================
    // QUEUE STATUS
    //
    // IMPORTANT:
    //
    // This function does NOT determine
    // calling order.
    //
    // It only determines how the backend
    // supplied state should be displayed.
    // =====================================

    const getQueueStatus =
        (athlete) => {

        if (
            sameEntry(
                athlete,
                currentAthlete
            )
        ) {

            return "CURRENT";

        }


        if (
            sameEntry(
                athlete,
                nextAthlete
            )
        ) {

            return "NEXT";

        }


        if (
            athlete?.completed ||
            athlete?.status === "COMPLETED"
        ) {

            return "COMPLETED";

        }


        return "UPCOMING";

    };


    // =====================================
    // STATUS LABEL
    // =====================================

    const getStatusLabel =
        (status) => {

        switch (status) {

            case "CURRENT":
                return "CURRENT";

            case "NEXT":
                return "NEXT";

            case "COMPLETED":
                return "COMPLETED";

            default:
                return "UPCOMING";

        }

    };


    // =====================================
    // PHASE LABEL
    // =====================================

    const getPhaseLabel =
        (phase) => {

        if (
            phase === "CLEAN_JERK"
        ) {

            return "CLEAN & JERK";

        }


        if (
            phase === "SNATCH"
        ) {

            return "SNATCH";

        }


        return phase ?? "-";

    };


    // =====================================
    // CAN EDIT DECLARATION?
    //
    // This is an Officials action, but it
    // does NOT select an athlete.
    //
    // The backend remains authoritative and
    // validates the actual declaration change.
    // =====================================

    const canEditDeclaration =
        (athlete) => {

        if (
            !athlete
        ) {

            return false;

        }


        // ---------------------------------
        // Current athlete
        //
        // Current athlete declaration is
        // controlled by CurrentAthletePanel.
        // ---------------------------------

        if (
            sameEntry(
                athlete,
                currentAthlete
            )
        ) {

            return false;

        }


        // ---------------------------------
        // Completed athlete
        // ---------------------------------

        if (
            athlete.completed ||
            athlete.status === "COMPLETED"
        ) {

            return false;

        }


        // ---------------------------------
        // Must have an active attempt
        // ---------------------------------

        if (
            !athlete.phase ||
            !Number.isInteger(
                athlete.attemptNo
            )
        ) {

            return false;

        }


        // ---------------------------------
        // Declaration editing is limited
        // to the active competition phase.
        // ---------------------------------

        if (
            athlete.phase !==
            currentPhase
        ) {

            return false;

        }


        // ---------------------------------
        // Attempt must still be pending.
        // ---------------------------------

        if (
            athlete.result &&
            athlete.result !== "PENDING"
        ) {

            return false;

        }


        return true;

    };


    // =====================================
    // START EDIT
    // =====================================

    const handleStartEdit =
        (athlete) => {

        if (
            savingDeclarationEntryId
        ) {

            return;

        }


        if (
            !canEditDeclaration(
                athlete
            )
        ) {

            return;

        }


        setEditingEntryId(
            athlete.entryId
        );


        setEditingWeight(
            athlete.declaredWeight != null
                ? String(
                    athlete.declaredWeight
                )
                : ""
        );

    };


    // =====================================
    // CANCEL EDIT
    // =====================================

    const handleCancelEdit =
        () => {

        if (
            savingDeclarationEntryId
        ) {

            return;

        }


        setEditingEntryId(
            null
        );

        setEditingWeight(
            ""
        );

    };


    // =====================================
    // SAVE EDIT
    // =====================================

    const handleSaveEdit =
        async (athlete) => {

        if (
            !athlete
        ) {

            return;

        }


        if (
            savingDeclarationEntryId
        ) {

            return;

        }


        if (
            !canEditDeclaration(
                athlete
            )
        ) {

            return;

        }


        const weight =
            Number(
                editingWeight
            );


        if (
            !Number.isFinite(weight) ||
            weight <= 0
        ) {

            return;

        }


        if (
            typeof onEditDeclaration !==
            "function"
        ) {

            console.error(
                "AthleteSelectionTable: onEditDeclaration is not a function."
            );

            return;

        }


        try {

            await onEditDeclaration({

                entryId:
                    athlete.entryId,

                declaredWeight:
                    weight,

            });


            // ---------------------------------
            // Parent has successfully completed
            // the authoritative API operation.
            // ---------------------------------

            setEditingEntryId(
                null
            );

            setEditingWeight(
                ""
            );

        } catch (error) {

            // ---------------------------------
            // Parent already owns the API
            // error handling.
            //
            // Keep editor open so the official
            // can see/retry the operation.
            // ---------------------------------

            console.error(
                "Failed to update declaration:",
                error
            );

        }

    };


    // =====================================
    // DISPLAY QUEUE
    //
    // The backend already provides:
    //
    // current
    // next
    // upcoming
    //
    // We do NOT sort this array.
    //
    // The order supplied by the backend is
    // authoritative.
    // =====================================

    const displayQueue = [

        ...(currentAthlete
            ? [currentAthlete]
            : []),

        ...(nextAthlete
            ? [nextAthlete]
            : []),

        ...(
            Array.isArray(
                upcomingAthletes
            )
                ? upcomingAthletes
                : []
        ),

    ];


    // =====================================
    // FALLBACK
    //
    // `athletes` is retained only as a
    // compatibility fallback.
    //
    // It is NOT reordered here.
    // =====================================

    const rows =
        displayQueue.length > 0
            ? displayQueue
            : athletes;


    // =====================================
    // COUNTS
    // =====================================

    const totalAthletes =
        rows.length;


    const completedAthletes =
        rows.filter(
            (athlete) =>
                athlete?.completed ||
                athlete?.status ===
                    "COMPLETED"
        ).length;


    const waitingAthletes =
        rows.filter(
            (athlete) => {

                const status =
                    getQueueStatus(
                        athlete
                    );

                return (
                    status ===
                    "UPCOMING"
                );

            }
        ).length;


    // =====================================
    // RENDER
    // =====================================

    return (

        <section className="official-athlete-list">


            {/* =================================
                HEADER
            ================================= */}

            <div className="official-list-header">

                <div>

                    <h2>
                        Automatic Calling Queue
                    </h2>


                </div>


                <strong>
                    {totalAthletes} in queue
                </strong>

            </div>


            {/* =================================
                AUTOMATIC QUEUE NOTICE
            ================================= */}




            {/* =================================
                TABLE
            ================================= */}

            <div className="official-list-table-wrapper">

                <table className="official-athlete-table">

                    <thead>

                        <tr>

                            <th>
                                Status
                            </th>

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
                                Phase
                            </th>

                            <th>
                                Attempt
                            </th>

                            <th>
                                Applicable
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

                        {rows.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="9"
                                    className="no-athletes-cell"
                                >

                                    No athletes are currently
                                    present in the authoritative
                                    queue.

                                </td>

                            </tr>

                        ) : (

                            rows.map(
                                (athlete) => {

                                    const status =
                                        getQueueStatus(
                                            athlete
                                        );


                                    const attemptNo =
                                        athlete.attemptNo ??
                                        null;


                                    const phase =
                                        athlete.phase ??
                                        null;


                                    const isEditing =
                                        editingEntryId
                                            ?.toString() ===
                                        athlete.entryId
                                            ?.toString();


                                    const isSaving =
                                        savingDeclarationEntryId
                                            ?.toString() ===
                                        athlete.entryId
                                            ?.toString();


                                    const editable =
                                        canEditDeclaration(
                                            athlete
                                        );


                                    return (

                                        <tr

                                            key={
                                                athlete.entryId
                                            }

                                            className={`
                                                official-athlete-row

                                                ${
                                                    status ===
                                                    "CURRENT"
                                                        ? "official-current-row"
                                                        : ""
                                                }

                                                ${
                                                    status ===
                                                    "NEXT"
                                                        ? "official-next-row"
                                                        : ""
                                                }

                                                ${
                                                    status ===
                                                    "COMPLETED"
                                                        ? "official-completed-row"
                                                        : ""
                                                }

                                                ${
                                                    status ===
                                                    "UPCOMING"
                                                        ? "official-upcoming-row"
                                                        : ""
                                                }
                                            `}
                                        >


                                            {/* =====================
                                                STATUS
                                            ===================== */}

                                            <td>

                                                <span
                                                    className={`
                                                        queue-status-badge

                                                        ${
                                                            status ===
                                                            "CURRENT"
                                                                ? "queue-status-current"
                                                                : ""
                                                        }

                                                        ${
                                                            status ===
                                                            "NEXT"
                                                                ? "queue-status-next"
                                                                : ""
                                                        }

                                                        ${
                                                            status ===
                                                            "COMPLETED"
                                                                ? "queue-status-completed"
                                                                : ""
                                                        }

                                                        ${
                                                            status ===
                                                            "UPCOMING"
                                                                ? "queue-status-upcoming"
                                                                : ""
                                                        }
                                                    `}
                                                >

                                                    {
                                                        getStatusLabel(
                                                            status
                                                        )
                                                    }

                                                </span>

                                            </td>


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

                                            </td>


                                            {/* =====================
                                                CATEGORY
                                            ===================== */}

                                            <td>

                                                {
                                                    athlete.displayWeightCategory ??
                                                    athlete.weightCategory ??
                                                    "-"
                                                }

                                            </td>


                                            {/* =====================
                                                PHASE
                                            ===================== */}

                                            <td>

                                                {
                                                    getPhaseLabel(
                                                        phase
                                                    )
                                                }

                                            </td>


                                            {/* =====================
                                                ATTEMPT
                                            ===================== */}

                                            <td>

                                                {
                                                    attemptNo ??
                                                    "-"
                                                }

                                            </td>


                                            {/* =====================
                                                APPLICABLE WEIGHT
                                            ===================== */}

                                            <td>

                                                {
                                                    athlete.applicableWeight != null
                                                        ? `${athlete.applicableWeight} kg`
                                                        : "-"
                                                }

                                            </td>


                                            {/* =====================
                                                DECLARED WEIGHT
                                            ===================== */}

                                            <td>

                                                {isEditing ? (

                                                    <input

                                                        type="number"

                                                        min="1"

                                                        step="1"

                                                        value={
                                                            editingWeight
                                                        }

                                                        disabled={
                                                            isSaving
                                                        }

                                                        onChange={
                                                            (event) =>
                                                                setEditingWeight(
                                                                    event.target.value
                                                                )
                                                        }

                                                        onKeyDown={
                                                            (event) => {

                                                                if (
                                                                    event.key ===
                                                                    "Enter"
                                                                ) {

                                                                    handleSaveEdit(
                                                                        athlete
                                                                    );

                                                                }


                                                                if (
                                                                    event.key ===
                                                                    "Escape"
                                                                ) {

                                                                    handleCancelEdit();

                                                                }

                                                            }
                                                        }

                                                        autoFocus

                                                    />

                                                ) : (

                                                    athlete.declaredWeight != null

                                                        ? `${athlete.declaredWeight} kg`

                                                        : "-"

                                                )}

                                            </td>


                                            {/* =====================
                                                ACTION
                                            ===================== */}

                                            <td>

                                                <div>

                                                    {editable &&
                                                        !isEditing && (

                                                        <button

                                                            type="button"

                                                            className="edit-declaration-btn"

                                                            disabled={
                                                                Boolean(
                                                                    savingDeclarationEntryId
                                                                )
                                                            }

                                                            onClick={() =>
                                                                handleStartEdit(
                                                                    athlete
                                                                )
                                                            }
                                                        >

                                                            EDIT

                                                        </button>

                                                    )}


                                                    {isEditing && (

                                                        <>

                                                            <button

                                                                type="button"

                                                                className="save-declaration-btn"

                                                                disabled={
                                                                    isSaving ||
                                                                    !editingWeight
                                                                }

                                                                onClick={() =>
                                                                    handleSaveEdit(
                                                                        athlete
                                                                    )
                                                                }
                                                            >

                                                                {
                                                                    isSaving
                                                                        ? "SAVING..."
                                                                        : "SAVE"
                                                                }

                                                            </button>


                                                            <button

                                                                type="button"

                                                                className="cancel-declaration-btn"

                                                                disabled={
                                                                    isSaving
                                                                }

                                                                onClick={
                                                                    handleCancelEdit
                                                                }
                                                            >

                                                                CANCEL

                                                            </button>

                                                        </>

                                                    )}


                                                    {!editable &&
                                                        !isEditing && (

                                                        <span
                                                            className="queue-action-status"
                                                        >

                                                            {
                                                                status ===
                                                                "CURRENT"
                                                                    ? "ON PLATFORM"
                                                                    : status ===
                                                                    "COMPLETED"
                                                                        ? "COMPLETED"
                                                                        : "AUTOMATIC"
                                                            }

                                                        </span>

                                                    )}

                                                </div>

                                            </td>

                                        </tr>

                                    );

                                }
                            )

                        )}

                    </tbody>

                </table>

            </div>


            {/* =================================
                FOOTER
            ================================= */}

            <div className="official-list-footer">

                <span>
                    Waiting: {waitingAthletes}
                </span>


                <span>
                    Completed: {completedAthletes}
                </span>


                <span>
                    Phase: {currentPhase}
                </span>

            </div>

        </section>

    );

};


export default AthleteSelectionTable;