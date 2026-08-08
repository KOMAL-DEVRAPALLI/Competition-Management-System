import "./AthleteSelectionTable.css";

const AthleteSelectionTable = ({
    athletes = [],
    currentAthlete = null,
    currentPhase = "SNATCH",
    canSelectAnotherAthlete = false,
    selectingAthlete = false,
    onSelectAthlete,
}) => {

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
                athlete.status === "COMPLETED" ||
                athlete.currentAttempt?.completed
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
        // The current athlete can remain
        // selected after Good / No Lift.
        //
        // Another athlete can only be
        // selected after the current
        // athlete's next declaration
        // has been saved.
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
    // BUTTON DISABLED
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

                                                {
                                                    attempt?.declaredWeight != null &&
                                                    Number(
                                                        attempt.declaredWeight
                                                    ) > 0
                                                        ? `${attempt.declaredWeight} kg`
                                                        : "-"
                                                }

                                            </td>


                                            {/* =========================
                                                ACTION
                                            ========================= */}

                                            <td>

                                                <button
                                                    type="button"
                                                    className="select-athlete-btn"
                                                    disabled={
                                                        buttonDisabled
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