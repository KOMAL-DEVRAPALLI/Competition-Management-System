import "./LiveScoreHeader.css"
const AthleteSelectionTable = ({
    athletes,
    currentAthlete,
    currentPhase,
    selectingAthlete,
    canSelectAnotherAthlete,
    getCurrentWeight,
    onSelectAthlete,
}) => {

    const officialAthletes =
        Array.isArray(athletes)
            ? athletes
            : [];

    return (
        <section className="official-athlete-list">

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

                    {!canSelectAnotherAthlete &&
                        currentAthlete && (
                            <p className="selection-locked-message">
                                Declare the current athlete's
                                next attempt before selecting
                                another athlete.
                            </p>
                        )}

                    {canSelectAnotherAthlete &&
                        currentAthlete && (
                            <p className="selection-ready-message">
                                Current declaration is saved.
                                You may select another eligible
                                athlete.
                            </p>
                        )}

                </div>

                <strong>
                    {officialAthletes.length} athletes
                </strong>

            </div>

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

                        {officialAthletes.map(
                            (athlete) => {

                                const attempt =
                                    athlete.currentAttempt;

                                const weight =
                                    getCurrentWeight(
                                        athlete
                                    );

                                const isSelected =
                                    currentAthlete &&
                                    currentAthlete
                                        .entryId
                                        ?.toString() ===
                                    athlete
                                        .entryId
                                        ?.toString();

                                const isCompleted =
                                    attempt?.completed ===
                                    true;

                                const wrongPhase =
                                    attempt &&
                                    attempt.phase !==
                                    currentPhase;

                                const isCurrent =
                                    isSelected;

                                const canSelect =
                                    !selectingAthlete &&
                                    !isCompleted &&
                                    !wrongPhase &&
                                    !isCurrent &&
                                    (
                                        !currentAthlete ||
                                        canSelectAnotherAthlete
                                    );

                                return (
                                    <tr
                                        key={
                                            athlete.entryId
                                        }
                                        className={
                                            isSelected
                                                ? "official-selected-row"
                                                : isCompleted
                                                ? "official-completed-row"
                                                : ""
                                        }
                                    >

                                        {/* LOT */}

                                        <td>
                                            {
                                                athlete
                                                    .lotNumber
                                            }
                                        </td>

                                        {/* NAME */}

                                        <td>
                                            <strong>
                                                {
                                                    athlete
                                                        .name
                                                }
                                            </strong>
                                        </td>

                                        {/* CATEGORY */}

                                        <td>
                                            {
                                                athlete
                                                    .weightCategory ??
                                                "-"
                                            }
                                        </td>

                                        {/* ATTEMPT */}

                                        <td>
                                            {
                                                attempt
                                                    ?.phase ??
                                                "-"
                                            }{" "}
                                            {
                                                attempt
                                                    ?.attemptNo ??
                                                "-"
                                            }
                                        </td>

                                        {/* WEIGHT */}

                                        <td>
                                            {
                                                weight ??
                                                "-"
                                            } kg
                                        </td>

                                        {/* ACTION */}

                                        <td>

                                            <button
                                                type="button"
                                                className="select-athlete-btn"
                                                disabled={
                                                    !canSelect
                                                }
                                                onClick={() =>
                                                    onSelectAthlete(
                                                        athlete
                                                    )
                                                }
                                            >

                                                {isSelected
                                                    ? "SELECTED"
                                                    : isCompleted
                                                    ? "COMPLETED"
                                                    : wrongPhase
                                                    ? "WRONG PHASE"
                                                    : selectingAthlete
                                                    ? "SELECTING..."
                                                    : currentAthlete &&
                                                      !canSelectAnotherAthlete
                                                    ? "DECLARATION REQUIRED"
                                                    : "SELECT"}

                                            </button>

                                        </td>

                                    </tr>
                                );
                            }
                        )}

                        {!officialAthletes.length && (

                            <tr>

                                <td
                                    colSpan="6"
                                    className="no-athletes-cell"
                                >
                                    No athletes available.
                                </td>

                            </tr>

                        )}

                    </tbody>

                </table>

            </div>

        </section>
    );
};

export default AthleteSelectionTable;