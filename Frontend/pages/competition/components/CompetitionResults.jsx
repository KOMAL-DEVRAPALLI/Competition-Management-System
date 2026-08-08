import "./CompetitionResults.css";

const CompetitionResults = ({
    competitionResults = [],
    currentAthlete = null,
}) => {

    // =====================================
    // RENDER ATTEMPT
    // =====================================

    const renderAttempt = (
        attempt,
        openingWeight = null
    ) => {

        // ---------------------------------
        // No attempt data
        // ---------------------------------

        if (!attempt) {

            if (
                openingWeight != null &&
                Number(openingWeight) > 0
            ) {
                return `${openingWeight}`;
            }

            return "-";
        }


        // ---------------------------------
        // Declared weight
        // ---------------------------------

        const weight =
            attempt.declaredWeight;


        // ---------------------------------
        // PENDING
        // ---------------------------------

        if (
            attempt.result === "PENDING"
        ) {

            if (
                weight != null &&
                Number(weight) > 0
            ) {
                return `${weight}`;
            }

            return "-";
        }


        // ---------------------------------
        // GOOD LIFT
        // ---------------------------------

        if (
            attempt.result === "GOOD"
        ) {

            if (
                weight != null &&
                Number(weight) > 0
            ) {
                return `${weight}`;
            }

            return "✓";
        }


        // ---------------------------------
        // NO LIFT
        // ---------------------------------

        if (
            attempt.result === "NO_LIFT"
        ) {

            if (
                weight != null &&
                Number(weight) > 0
            ) {
                return (
                    <span className="attempt-no-lift">
                        {weight}
                    </span>
                );
            }

            return "X";
        }


        // ---------------------------------
        // UNKNOWN RESULT
        // ---------------------------------

        if (
            weight != null &&
            Number(weight) > 0
        ) {
            return `${weight}`;
        }


        return "-";
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

                <h2>
                    Live Scoreboard
                </h2>

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

                        {competitionResults.map(
                            (athlete) => {

                                // =================================
                                // CURRENT ATHLETE
                                // =================================

                                const isCurrent =
                                    currentAthlete &&
                                    currentAthlete
                                        .entryId
                                        ?.toString() ===
                                    athlete
                                        .entryId
                                        ?.toString();


                                // =================================
                                // ROW CLASS
                                // =================================

                                const rowClass =
                                    isCurrent
                                        ? "scoreboard-current-row"
                                        : athlete.status ===
                                          "COMPLETED"
                                        ? "scoreboard-completed-row"
                                        : "";


                                return (

                                    <tr
                                        key={
                                            athlete.entryId
                                        }
                                        className={
                                            rowClass
                                        }
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
                                            SNATCH 1
                                        ========================= */}

                                        <td>

                                            {renderAttempt(
                                                athlete
                                                    .snatchAttempts
                                                    ?.[0],
                                                athlete.openingSnatch
                                            )}

                                        </td>


                                        {/* =========================
                                            SNATCH 2
                                        ========================= */}

                                        <td>

                                            {renderAttempt(
                                                athlete
                                                    .snatchAttempts
                                                    ?.[1]
                                            )}

                                        </td>


                                        {/* =========================
                                            SNATCH 3
                                        ========================= */}

                                        <td>

                                            {renderAttempt(
                                                athlete
                                                    .snatchAttempts
                                                    ?.[2]
                                            )}

                                        </td>


                                        {/* =========================
                                            CLEAN & JERK 1
                                        ========================= */}

                                        <td>

                                            {renderAttempt(
                                                athlete
                                                    .cleanJerkAttempts
                                                    ?.[0],
                                                athlete.openingCleanJerk
                                            )}

                                        </td>


                                        {/* =========================
                                            CLEAN & JERK 2
                                        ========================= */}

                                        <td>

                                            {renderAttempt(
                                                athlete
                                                    .cleanJerkAttempts
                                                    ?.[1]
                                            )}

                                        </td>


                                        {/* =========================
                                            CLEAN & JERK 3
                                        ========================= */}

                                        <td>

                                            {renderAttempt(
                                                athlete
                                                    .cleanJerkAttempts
                                                    ?.[2]
                                            )}

                                        </td>


                                        {/* =========================
                                            BEST SNATCH
                                        ========================= */}

                                        <td>

                                            <strong>
                                                {
                                                    athlete.bestSnatch ??
                                                    0
                                                }
                                            </strong>

                                        </td>


                                        {/* =========================
                                            BEST CLEAN & JERK
                                        ========================= */}

                                        <td>

                                            <strong>
                                                {
                                                    athlete.bestCleanJerk ??
                                                    0
                                                }
                                            </strong>

                                        </td>


                                        {/* =========================
                                            TOTAL
                                        ========================= */}

                                        <td>

                                            <strong>
                                                {
                                                    athlete.total ??
                                                    0
                                                }
                                            </strong>

                                        </td>


                                        {/* =========================
                                            RANK
                                        ========================= */}

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
                        )}


                        {/* =================================
                            EMPTY STATE
                        ================================= */}

                        {!competitionResults.length && (

                            <tr>

                                <td
                                    colSpan="12"
                                    className="no-scoreboard-data"
                                >
                                    No scoreboard data available.
                                </td>

                            </tr>

                        )}

                    </tbody>

                </table>

            </div>

        </section>

    );
};


export default CompetitionResults;