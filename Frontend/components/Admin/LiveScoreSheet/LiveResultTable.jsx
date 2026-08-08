import "./LiveResultTable.css";

const ScoreboardTable = ({
    competitionResults,
}) => {

    if (!competitionResults?.length) {

        return (
            <div className="scoreboard">

                <div className="scoreboard-header">
                    <h2>
                        Live Scoreboard
                    </h2>
                </div>

                <p>No Athletes</p>

            </div>
        );

    }

    // -----------------------------------
    // Render individual attempt
    // -----------------------------------

    const renderAttempt = (
        attempt,
        openingWeight = null
    ) => {

        if (!attempt) {
            return "-";
        }

        // -----------------------------------
        // Determine display weight
        //
        // Attempt 1:
        // Use official declaration if it exists.
        // Otherwise show opening weight.
        //
        // Attempt 2 / 3:
        // Show only official declaration.
        // -----------------------------------

        let displayWeight = null;

        if (attempt.attemptNo === 1) {

            displayWeight =
                attempt.declaredWeight ??
                openingWeight;

        } else {

            displayWeight =
                attempt.declaredWeight;

        }

        // -----------------------------------
        // GOOD LIFT
        // -----------------------------------

        if (
            attempt.result === "GOOD"
        ) {

            return (
                <span className="attempt-good">
                    {displayWeight ?? "-"} ✓
                </span>
            );

        }

        // -----------------------------------
        // NO LIFT
        // -----------------------------------

        if (
            attempt.result === "NO_LIFT"
        ) {

            return (
                <span className="attempt-fail">
                    {displayWeight ?? "-"} ✗
                </span>
            );

        }

        // -----------------------------------
        // PENDING
        // -----------------------------------

        return (
            <span className="attempt-pending">
                {displayWeight ?? "-"}
            </span>
        );

    };

    return (

        <div className="scoreboard">

            <div className="scoreboard-header">

                <h2>
                    Live Scoreboard
                </h2>

            </div>

            <table className="scoreboard-table">

                <thead>

                    <tr>

                        <th>Lot</th>

                        <th>Name</th>

                        <th>S1</th>
                        <th>S2</th>
                        <th>S3</th>

                        <th>CJ1</th>
                        <th>CJ2</th>
                        <th>CJ3</th>

                        <th>Best S</th>
                        <th>Best CJ</th>
                        <th>Total</th>
                        <th>Rank</th>

                    </tr>

                </thead>

                <tbody>

                    {competitionResults.map(
                        (athlete) => (

                            <tr
                                key={
                                    athlete.entryId
                                }
                                className={
                                    athlete.status ===
                                    "ON_PLATFORM"
                                        ? "scoreboard-current-row"
                                        : athlete.status ===
                                          "NEXT"
                                        ? "scoreboard-next-row"
                                        : athlete.status ===
                                          "COMPLETED"
                                        ? "scoreboard-completed-row"
                                        : ""
                                }
                            >

                                {/* -----------------------------------
                                    LOT
                                    ----------------------------------- */}

                                <td>
                                    {
                                        athlete.lotNumber
                                    }
                                </td>

                                {/* -----------------------------------
                                    NAME
                                    ----------------------------------- */}

                                <td>

                                    <strong>
                                        {
                                            athlete.name
                                        }
                                    </strong>

                                </td>

                                {/* -----------------------------------
                                    SNATCH
                                    ----------------------------------- */}

                                <td>
                                    {renderAttempt(
                                        athlete
                                            .snatchAttempts?.[0],
                                        athlete
                                            .openingSnatch
                                    )}
                                </td>

                                <td>
                                    {renderAttempt(
                                        athlete
                                            .snatchAttempts?.[1]
                                    )}
                                </td>

                                <td>
                                    {renderAttempt(
                                        athlete
                                            .snatchAttempts?.[2]
                                    )}
                                </td>

                                {/* -----------------------------------
                                    CLEAN & JERK
                                    ----------------------------------- */}

                                <td>
                                    {renderAttempt(
                                        athlete
                                            .cleanJerkAttempts?.[0],
                                        athlete
                                            .openingCleanJerk
                                    )}
                                </td>

                                <td>
                                    {renderAttempt(
                                        athlete
                                            .cleanJerkAttempts?.[1]
                                    )}
                                </td>

                                <td>
                                    {renderAttempt(
                                        athlete
                                            .cleanJerkAttempts?.[2]
                                    )}
                                </td>

                                {/* -----------------------------------
                                    BEST SNATCH
                                    ----------------------------------- */}

                                <td>

                                    <strong>
                                        {
                                            athlete.bestSnatch
                                        }
                                    </strong>

                                </td>

                                {/* -----------------------------------
                                    BEST CLEAN & JERK
                                    ----------------------------------- */}

                                <td>

                                    <strong>
                                        {
                                            athlete.bestCleanJerk
                                        }
                                    </strong>

                                </td>

                                {/* -----------------------------------
                                    TOTAL
                                    ----------------------------------- */}

                                <td>

                                    <strong>
                                        {
                                            athlete.total
                                        }
                                    </strong>

                                </td>

                                {/* -----------------------------------
                                    RANK
                                    ----------------------------------- */}

                                <td>

                                    {
                                        athlete.place ??
                                        "-"
                                    }

                                </td>

                            </tr>

                        )
                    )}

                </tbody>

            </table>

        </div>

    );

};

export default ScoreboardTable;