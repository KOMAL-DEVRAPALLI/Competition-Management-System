import { useState } from "react";

import "./AthleteSelectionTable.css";


const AthleteSelectionTable = ({
    athletes = [],
    currentAthlete = null,

    currentPhase = "SNATCH",

    canSelectAnotherAthlete = false,

    selectingAthlete = false,

    onSelectAthlete,

    // =====================================
    // DECLARATION EDITING
    // =====================================

    onEditDeclaration,

    savingDeclarationEntryId = null,
}) => {

    // =====================================
    // LOCAL EDIT STATE
    // =====================================

    const [editingEntryId, setEditingEntryId] =
        useState(null);

    const [editingWeight, setEditingWeight] =
        useState("");


    // =====================================
    // CURRENT ATHLETE ATTEMPT
    // =====================================

    const currentAttempt =
        currentAthlete?.currentAttempt ?? null;


    // =====================================
    // ATHLETE COUNTS
    // =====================================

    const totalAthletes =
        athletes.length;


    const completedAthletes =
        athletes.filter(
            (athlete) =>
                athlete.status ===
                    "COMPLETED" ||
                athlete.currentAttempt
                    ?.completed
        ).length;


    const availableAthletes =
        athletes.filter(
            (athlete) => {

                if (
                    athlete.status ===
                    "COMPLETED"
                ) {

                    return false;

                }


                if (
                    athlete.currentAttempt
                        ?.completed
                ) {

                    return false;

                }


                if (
                    athlete.currentAttempt
                        ?.phase !==
                    currentPhase
                ) {

                    return false;

                }


                return true;

            }
        ).length;


    // =====================================
    // HANDLE SELECTION
    //
    // IMPORTANT:
    //
    // Selection and declaration editing are
    // completely separate actions.
    // =====================================

    const handleSelect =
        (athlete) => {

        if (
            selectingAthlete
        ) {

            return;

        }


        if (
            !athlete
        ) {

            return;

        }


        // =================================
        // CURRENT ATHLETE
        // =================================

        if (
            currentAthlete &&
            athlete.entryId?.toString() ===
            currentAthlete.entryId?.toString()
        ) {

            return;

        }


        // =================================
        // CURRENT ATHLETE DECLARATION
        //
        // This restriction applies ONLY
        // to selecting another athlete.
        //
        // It does NOT prevent editing
        // another athlete's declaration.
        // =================================

        if (
            currentAthlete &&
            !canSelectAnotherAthlete
        ) {

            return;

        }


        // =================================
        // VALID ATTEMPT
        // =================================

        if (
            !athlete.currentAttempt ||
            athlete.currentAttempt.completed
        ) {

            return;

        }


        // =================================
        // VERIFY PHASE
        // =================================

        if (
            athlete.currentAttempt.phase !==
            currentPhase
        ) {

            return;

        }


        // =================================
        // SELECT
        // =================================

        if (
            typeof onSelectAthlete !==
            "function"
        ) {

            console.error(
                "AthleteSelectionTable: onSelectAthlete is not a function."
            );

            return;

        }


        onSelectAthlete(
            athlete
        );

    };


    // =====================================
    // CAN EDIT DECLARATION?
    //
    // This is intentionally independent
    // from canSelectAnotherAthlete.
    //
    // Therefore:
    //
    // A = current athlete
    // E = future athlete
    //
    // Even if A still needs declaration,
    // E's declaration can be edited.
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
        // Current athlete uses the main
        // CurrentAthletePanel.
        // ---------------------------------

        if (
            currentAthlete &&
            athlete.entryId?.toString() ===
            currentAthlete.entryId?.toString()
        ) {

            return false;

        }


        // ---------------------------------
        // Completed athlete
        // ---------------------------------

        if (
            athlete.status ===
            "COMPLETED"
        ) {

            return false;

        }


        // ---------------------------------
        // Completed current attempt
        // ---------------------------------

        if (
            athlete.currentAttempt
                ?.completed
        ) {

            return false;

        }


        // ---------------------------------
        // No attempt
        // ---------------------------------

        if (
            !athlete.currentAttempt
        ) {

            return false;

        }


        // ---------------------------------
        // WRONG PHASE
        //
        // Example:
        //
        // Competition = SNATCH
        // Athlete's current attempt = C&J
        //
        // Do not allow editing.
        // ---------------------------------

        if (
            athlete.currentAttempt.phase !==
            currentPhase
        ) {

            return false;

        }


        // ---------------------------------
        // Attempt already completed
        // ---------------------------------

        if (
            athlete.currentAttempt.result &&
            athlete.currentAttempt.result !==
                "PENDING"
        ) {

            return false;

        }


        return true;

    };


    // =====================================
    // START EDITING DECLARATION
    // =====================================

    const handleStartEdit =
        (athlete) => {

        if (
            !canEditDeclaration(
                athlete
            )
        ) {

            return;

        }


        // ---------------------------------
        // Prevent another edit while one
        // is already being saved.
        // ---------------------------------

        if (
            savingDeclarationEntryId
        ) {

            return;

        }


        // ---------------------------------
        // Existing declaration
        // ---------------------------------

        const existingWeight =
            athlete.currentAttempt
                ?.declaredWeight;


        setEditingEntryId(
            athlete.entryId
        );


        setEditingWeight(
            existingWeight != null
                ? String(existingWeight)
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
    // SAVE EDITED DECLARATION
    // =====================================

    const handleSaveEdit =
        async (athlete) => {

        if (
            !athlete
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


        // ---------------------------------
        // Prevent duplicate save
        // ---------------------------------

        if (
            savingDeclarationEntryId
        ) {

            return;

        }


        // ---------------------------------
        // Validate weight
        // ---------------------------------

        const weight =
            Number(
                editingWeight
            );


        if (
            Number.isNaN(weight) ||
            weight <= 0
        ) {

            return;

        }


        // ---------------------------------
        // Parent performs API request.
        //
        // This component does NOT call API.
        // ---------------------------------

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
            // Close editor only after the
            // parent operation resolves.
            // ---------------------------------

            setEditingEntryId(
                null
            );

            setEditingWeight(
                ""
            );

        } catch (error) {

            console.error(
                "Failed to edit declaration:",
                error
            );

        }

    };


    // =====================================
    // ROW STATUS
    // =====================================

    const getRowStatus =
        (athlete) => {

        const isCurrent =
            currentAthlete &&
            athlete.entryId?.toString() ===
            currentAthlete.entryId?.toString();


        // ---------------------------------
        // CURRENT ATHLETE
        // ---------------------------------

        if (
            isCurrent
        ) {

            return "CURRENT";

        }


        // ---------------------------------
        // COMPLETED
        // ---------------------------------

        if (
            athlete.status ===
                "COMPLETED" ||
            athlete.currentAttempt
                ?.completed
        ) {

            return "COMPLETED";

        }


        // ---------------------------------
        // WRONG PHASE
        // ---------------------------------

        if (
            !athlete.currentAttempt ||
            athlete.currentAttempt.phase !==
            currentPhase
        ) {

            return "WRONG_PHASE";

        }


        // ---------------------------------
        // CURRENT ATHLETE STILL NEEDS
        // NEXT DECLARATION
        //
        // This affects SELECT only.
        //
        // It does NOT affect EDIT.
        // ---------------------------------

        if (
            currentAthlete &&
            !canSelectAnotherAthlete
        ) {

            return "WAITING_DECLARATION";

        }


        // ---------------------------------
        // AVAILABLE
        // ---------------------------------

        return "AVAILABLE";

    };


    // =====================================
    // BUTTON TEXT
    // =====================================

    const getButtonText =
        (rowStatus) => {

        if (
            rowStatus ===
            "CURRENT"
        ) {

            return "SELECTED";

        }


        if (
            rowStatus ===
            "COMPLETED"
        ) {

            return "COMPLETED";

        }


        if (
            rowStatus ===
            "WRONG_PHASE"
        ) {

            return "NOT ELIGIBLE";

        }


        if (
            rowStatus ===
            "WAITING_DECLARATION"
        ) {

            return "WAIT";

        }


        if (
            selectingAthlete
        ) {

            return "SELECTING...";

        }


        return "SELECT";

    };


    // =====================================
    // SELECTION BUTTON DISABLED
    // =====================================

    const isButtonDisabled =
        (rowStatus) => {

        // ---------------------------------
        // CURRENT ATHLETE
        // ---------------------------------

        if (
            rowStatus ===
            "CURRENT"
        ) {

            return true;

        }


        // ---------------------------------
        // COMPLETED
        // ---------------------------------

        if (
            rowStatus ===
            "COMPLETED"
        ) {

            return true;

        }


        // ---------------------------------
        // WRONG PHASE
        // ---------------------------------

        if (
            rowStatus ===
            "WRONG_PHASE"
        ) {

            return true;

        }


        // ---------------------------------
        // CURRENT ATHLETE DECLARATION
        // NOT SAVED
        // ---------------------------------

        if (
            rowStatus ===
            "WAITING_DECLARATION"
        ) {

            return true;

        }


        // ---------------------------------
        // SELECTION IN PROGRESS
        // ---------------------------------

        if (
            selectingAthlete
        ) {

            return true;

        }


        return false;

    };


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
                        Official Athlete Selection
                    </h2>


                    <p>
                        Select the athlete manually.
                        The system will not decide who
                        lifts next.
                    </p>


                    <p>

                        {currentAthlete

                            ? canSelectAnotherAthlete

                                ? "Current athlete's declaration is saved. You can now select any eligible athlete."

                                : "Declare the current athlete's next attempt before selecting another athlete."

                            : "Select any eligible athlete for the current phase."

                        }

                    </p>


                    {/* =================================
                        DECLARATION EDIT INFORMATION
                    ================================= */}

                    <p>
                        Officials can edit a future
                        athlete's pending declaration
                        without selecting that athlete
                        or giving a lift decision.
                    </p>

                </div>


                <strong>
                    {totalAthletes} athletes
                </strong>

            </div>


            {/* =================================
                TABLE
            ================================= */}

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

                        {athletes.length === 0 ? (

                            <tr>

                                <td
                                    colSpan="6"
                                    className="no-athletes-cell"
                                >

                                    No athletes available.

                                </td>

                            </tr>

                        ) : (

                            athletes.map(
                                (athlete) => {

                                    const rowStatus =
                                        getRowStatus(
                                            athlete
                                        );


                                    const attempt =
                                        athlete.currentAttempt;


                                    const buttonDisabled =
                                        isButtonDisabled(
                                            rowStatus
                                        );


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
                                                    rowStatus ===
                                                    "CURRENT"
                                                        ? "official-selected-row"
                                                        : ""
                                                }

                                                ${
                                                    rowStatus ===
                                                    "COMPLETED"
                                                        ? "official-completed-row"
                                                        : ""
                                                }
                                            `}
                                        >


                                            {/* =========================
                                                LOT
                                            ========================= */}

                                            <td>

                                                {
                                                    athlete.lotNumber ??
                                                    "-"
                                                }

                                            </td>


                                            {/* =========================
                                                NAME
                                            ========================= */}

                                            <td>

                                                <strong>

                                                    {
                                                        athlete.name
                                                    }

                                                </strong>

                                            </td>


                                            {/* =========================
                                                CATEGORY
                                            ========================= */}

                                            <td>

                                                {
                                                    athlete.displayWeightCategory ??
                                                    athlete.weightCategory ??
                                                    "-"
                                                }

                                            </td>


                                            {/* =========================
                                                ATTEMPT
                                            ========================= */}

                                            <td>

                                                {attempt

                                                    ? `${attempt.phase === "SNATCH"
                                                        ? "SNATCH"
                                                        : "CLEAN & JERK"} ${attempt.attemptNo}`

                                                    : "-"

                                                }

                                            </td>


                                            {/* =========================
                                                DECLARED WEIGHT
                                            ========================= */}

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

                                                    attempt?.declaredWeight != null &&
                                                    Number(
                                                        attempt.declaredWeight
                                                    ) > 0

                                                        ? `${attempt.declaredWeight} kg`

                                                        : "-"

                                                )}

                                            </td>


                                            {/* =========================
                                                ACTION
                                            ========================= */}

                                            <td>

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "8px",
                                                        alignItems: "center",
                                                        flexWrap: "wrap",
                                                    }}
                                                >


                                                    {/* =====================
                                                        SELECT
                                                    ===================== */}

                                                    <button
                                                        type="button"

                                                        className="select-athlete-btn"

                                                        disabled={
                                                            buttonDisabled ||
                                                            isEditing ||
                                                            !!savingDeclarationEntryId
                                                        }

                                                        onClick={() =>
                                                            handleSelect(
                                                                athlete
                                                            )
                                                        }
                                                    >

                                                        {
                                                            getButtonText(
                                                                rowStatus
                                                            )
                                                        }

                                                    </button>


                                                    {/* =====================
                                                        EDIT DECLARATION
                                                    ===================== */}

                                                    {editable &&
                                                        !isEditing && (

                                                        <button
                                                            type="button"

                                                            className="edit-declaration-btn"

                                                            disabled={
                                                                !!savingDeclarationEntryId ||
                                                                selectingAthlete
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


                                                    {/* =====================
                                                        SAVE / CANCEL
                                                    ===================== */}

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

                                                                {isSaving
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
                    Available: {availableAthletes}
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