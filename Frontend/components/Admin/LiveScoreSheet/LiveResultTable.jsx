import "./LiveResultTable.css"
const ScoreboardTable = ({
    competitionResults,
}) => {

    if (!competitionResults?.length) {

        return (

            <div className="scoreboard">

                <div className="scoreboard-header">

                    <h2>Live Scoreboard</h2>

                </div>

                <p>No Athletes</p>

            </div>

        );

    }

    const renderAttempt = (attempt) => {

        if (!attempt) return "-";

        if (attempt.result === "GOOD") {

            return (
                <span className="attempt-good">
                    {attempt.declaredWeight} ✓
                </span>
            );

        }

        if (attempt.result === "NO_LIFT") {

            return (
                <span className="attempt-fail">
                    {attempt.declaredWeight} ✗
                </span>
            );

        }

        return (
            <span className="attempt-pending">
                {attempt.declaredWeight ?? "-"}
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

                    {competitionResults.map((athlete) => (

                       <tr
    key={athlete.entryId}
    className={
        athlete.status === "ON_PLATFORM"
            ? "scoreboard-current-row"
            : athlete.status === "NEXT"
            ? "scoreboard-next-row"
            : athlete.status === "COMPLETED"
            ? "scoreboard-completed-row"
            : ""
    }
>

                            <td>{athlete.lotNumber}</td>

                            <td>

                                <strong>

                                    {athlete.name}

                                </strong>

                            </td>

                            <td>{renderAttempt(athlete.snatchAttempts[0])}</td>
                            <td>{renderAttempt(athlete.snatchAttempts[1])}</td>
                            <td>{renderAttempt(athlete.snatchAttempts[2])}</td>

                            <td>{renderAttempt(athlete.cleanJerkAttempts[0])}</td>
                            <td>{renderAttempt(athlete.cleanJerkAttempts[1])}</td>
                            <td>{renderAttempt(athlete.cleanJerkAttempts[2])}</td>

                            <td>

                                <strong>

                                    {athlete.bestSnatch}

                                </strong>

                            </td>

                            <td>

                                <strong>

                                    {athlete.bestCleanJerk}

                                </strong>

                            </td>

                            <td>

                                <strong>

                                    {athlete.total}

                                </strong>

                            </td>

                            <td>

                                {athlete.place ?? "-"}

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

};

export default ScoreboardTable;