import "./CompetitionResults.css"
const CompetitionResults = ({
    competitionResults,
    currentAthlete,
    renderAttempt,
}) => {

    return (
        <section className="scoreboard">

            <div className="scoreboard-header">

                <h2>
                    Live Scoreboard
                </h2>

            </div>

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

                                const isCurrent =
                                    currentAthlete &&
                                    currentAthlete
                                        .entryId
                                        ?.toString() ===
                                    athlete
                                        .entryId
                                        ?.toString();

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

                                        <td>
                                            {
                                                athlete
                                                    .lotNumber
                                            }
                                        </td>

                                        <td>
                                            <strong>
                                                {
                                                    athlete
                                                        .name
                                                }
                                            </strong>
                                        </td>

                                        <td>
                                            {renderAttempt(
                                                athlete
                                                    .snatchAttempts
                                                    ?.[0],
                                                athlete
                                                    .openingSnatch
                                            )}
                                        </td>

                                        <td>
                                            {renderAttempt(
                                                athlete
                                                    .snatchAttempts
                                                    ?.[1]
                                            )}
                                        </td>

                                        <td>
                                            {renderAttempt(
                                                athlete
                                                    .snatchAttempts
                                                    ?.[2]
                                            )}
                                        </td>

                                        <td>
                                            {renderAttempt(
                                                athlete
                                                    .cleanJerkAttempts
                                                    ?.[0],
                                                athlete
                                                    .openingCleanJerk
                                            )}
                                        </td>

                                        <td>
                                            {renderAttempt(
                                                athlete
                                                    .cleanJerkAttempts
                                                    ?.[1]
                                            )}
                                        </td>

                                        <td>
                                            {renderAttempt(
                                                athlete
                                                    .cleanJerkAttempts
                                                    ?.[2]
                                            )}
                                        </td>

                                        <td>
                                            <strong>
                                                {
                                                    athlete
                                                        .bestSnatch ??
                                                    0
                                                }
                                            </strong>
                                        </td>

                                        <td>
                                            <strong>
                                                {
                                                    athlete
                                                        .bestCleanJerk ??
                                                    0
                                                }
                                            </strong>
                                        </td>

                                        <td>
                                            <strong>
                                                {
                                                    athlete
                                                        .total ??
                                                    0
                                                }
                                            </strong>
                                        </td>

                                        <td>
                                            {
                                                athlete
                                                    .place ??
                                                athlete
                                                    .rank ??
                                                "-"
                                            }
                                        </td>

                                    </tr>
                                );
                            }
                        )}

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