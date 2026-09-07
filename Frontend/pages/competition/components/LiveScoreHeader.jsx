import "./LiveScoreHeader.css"

const LiveScoreHeader = ({
    competitionName,
    competitionId,
    status,
    currentPhase,
    totalAthletes,
}) => {

    return (
        <header className="live-score-header">

            {/* =================================
                COMPETITION INFORMATION
            ================================= */}

            <div className="live-score-header-main">

                <h1>
                    Live Competition
                </h1>

                <p>
                    Competition:{" "}
                    {competitionName ||
                        "Competition"}
                </p>

            </div>


            {/* =================================
                SESSION INFORMATION
            ================================= */}

            <div className="live-score-session">

                <span>
                    Status:{" "}
                    <strong>
                        {status}
                    </strong>
                </span>


                <span>
                    Phase:{" "}
                    <strong>
                        {currentPhase}
                    </strong>
                </span>


                <span>
                    Athletes:{" "}
                    <strong>
                        {totalAthletes}
                    </strong>
                </span>

            </div>

        </header>
    );
};


export default LiveScoreHeader;