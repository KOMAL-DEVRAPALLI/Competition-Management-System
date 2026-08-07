const ScoreboardTable = ({
    competitionResults,
}) => {

    if (!competitionResults.length) {

        return (
            <div className="scoreboard">

                <div className="scoreboard-header">
                    <h2>Competition Results</h2>
                </div>

                <p>No Athletes</p>

            </div>
        );

    }

    const renderAttempt = (attempt) => {

        if (!attempt) return "-";

        if (attempt.result === "GOOD") {
            return `${attempt.declaredWeight} ✓`;
        }

        if (attempt.result === "NO_LIFT") {
            return `${attempt.declaredWeight} ✗`;
        }

        return attempt.declaredWeight ?? "-";

    };

    return (

        <div className="scoreboard">

            <div className="scoreboard-header">

                <h2>Competition Results</h2>

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

                        <th>Place</th>

                        <th>Status</th>

                    </tr>

                </thead>

                <tbody>

                    {competitionResults.map((athlete) => (

                        <tr key={athlete.entryId}>

                            <td>{athlete.lotNumber}</td>

                            <td>{athlete.name}</td>

                            <td>
                                {renderAttempt(
                                    athlete.snatchAttempts[0]
                                )}
                            </td>

                            <td>
                                {renderAttempt(
                                    athlete.snatchAttempts[1]
                                )}
                            </td>

                            <td>
                                {renderAttempt(
                                    athlete.snatchAttempts[2]
                                )}
                            </td>

                            <td>
                                {renderAttempt(
                                    athlete.cleanJerkAttempts[0]
                                )}
                            </td>

                            <td>
                                {renderAttempt(
                                    athlete.cleanJerkAttempts[1]
                                )}
                            </td>

                            <td>
                                {renderAttempt(
                                    athlete.cleanJerkAttempts[2]
                                )}
                            </td>

                            <td>{athlete.bestSnatch}</td>

                            <td>{athlete.bestCleanJerk}</td>

                            <td>{athlete.total}</td>

                            <td>{athlete.place}</td>

                            <td>

                                <span
                                    className={`scoreboard-status ${athlete.status.toLowerCase()}`}
                                >

                                    {athlete.status}

                                </span>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

};

export default ScoreboardTable;