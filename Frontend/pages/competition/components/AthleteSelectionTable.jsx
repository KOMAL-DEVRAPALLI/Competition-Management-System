import "./AthleteSelectionTable.css";

const AthleteSelectionTable = ({
    athletes = [],
    currentAthlete = null,
    currentPhase = "SNATCH",
    selectingAthlete = false,
    onSelectAthlete,
}) => {

    // =====================================
    // CURRENT ATHLETE ATTEMPT
    // =====================================

    const currentAttempt =
        currentAthlete?.currentAttempt ?? null;


    // =====================================
    // CAN OFFICIAL SELECT ANOTHER ATHLETE?
    //
    // IMPORTANT:
    //
    // The current athlete remains selected
    // after GOOD / NO LIFT.
    //
    // Once the NEXT attempt declaration
    // has been saved, another athlete can
    // be selected.
    // =====================================

    const currentAttemptDeclared =
        currentAttempt &&
        currentAttempt.declaredWeight != null &&
        Number(
            currentAttempt.declaredWeight
        ) > 0;


    const canSelectAnotherAthlete =
        !currentAthlete ||
        currentAttemptDeclared;


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


        // ---------------------------------
        // Current athlete
        // ---------------------------------

        if (
            currentAthlete &&
            athlete.entryId?.toString() ===
            currentAthlete.entryId?.toString()
        ) {
            return;
        }


        // ---------------------------------
        // Current athlete's declaration
        // must be completed first.
        // ---------------------------------

        if (
            currentAthlete &&
            !canSelectAnotherAthlete
        ) {
            return;
        }


        // ---------------------------------
        // Athlete must have a current
        // attempt.
        // ---------------------------------

        if (
            !athlete.currentAttempt ||
            athlete.currentAttempt.completed
        ) {
            return;
        }


        // ---------------------------------
        // Athlete must belong to the
        // current competition phase.
        // ---------------------------------

        if (
            athlete.currentAttempt.phase !==
            currentPhase
        ) {
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


        if (isCurrent) {
            return "CURRENT";
        }


        if (
            athlete.status ===
            "COMPLETED" ||
            athlete.currentAttempt
                ?.completed
        ) {
            return "COMPLETED";
        }


        if (
            !athlete.currentAttempt ||
            athlete.currentAttempt.phase !==
            currentPhase
        ) {
            return "WRONG_PHASE";
        }


        if (
            currentAthlete &&
            !canSelectAnotherAthlete
        ) {
            return "WAITING_DECLARATION";
        }


        return "AVAILABLE";
    };


    // =====================================
    // BUTTON TEXT
    // =====================================

    const getButtonText =
        (athlete, rowStatus) => {

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
        (athlete, rowStatus) => {

        // Current athlete
        if (
            rowStatus ===
            "CURRENT"
        ) {
            return true;
        }


        // Completed athlete
        if (
            rowStatus ===
            "COMPLETED"
        ) {
            return true;
        }


        // Wrong phase
        if (
            rowStatus ===
            "WRONG_PHASE"
        ) {
            return true;
        }


        // Current athlete has not
        // declared next attempt yet.
        if (
            rowStatus ===
            "WAITING_DECLARATION"
        ) {
            return true;
        }


        // Another selection request
        // is currently being processed.
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
                            ? currentAttemptDeclared
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
                                            athlete,
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
                                                            athlete,
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
                FOOTER INFORMATION
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