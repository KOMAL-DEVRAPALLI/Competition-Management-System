import "./CurrentLiftCard.css";

const CurrentAthleteCard = ({
    currentAthlete,
    onGoodLift,
    onNoLift,
}) => {

    if (!currentAthlete) {

        return (
            <div className="current-athlete-card no-athlete">
                No Athlete On Platform
            </div>
        );

    }

    const weightOnBar =
        currentAthlete.currentAttempt.declaredWeight ??
        (
            currentAthlete.currentAttempt.attemptNo === 1
                ? (
                    currentAthlete.currentAttempt.phase === "SNATCH"
                        ? currentAthlete.openingSnatch
                        : currentAthlete.openingCleanJerk
                )
                : "Waiting for Declaration"
        );

    return (

        <div className="current-athlete-card">

            <div className="current-athlete-header">

                <h2>Current Lift</h2>

            </div>

            <div className="current-athlete-details">

                <div className="current-athlete-row">

                    <span>Lot Number</span>

                    <strong>{currentAthlete.lotNumber}</strong>

                </div>

                <div className="current-athlete-row">

                    <span>Name</span>

                    <strong>{currentAthlete.name}</strong>

                </div>

                <div className="current-athlete-row">

                    <span>Current Attempt</span>

                    <strong>
                        {currentAthlete.currentAttempt.phase}
                        {" "}
                        {currentAthlete.currentAttempt.attemptNo}
                    </strong>

                </div>

                <div className="current-athlete-row">

                    <span>Weight On Bar</span>

                    <strong>

                        {typeof weightOnBar === "number"
                            ? `${weightOnBar} kg`
                            : weightOnBar}

                    </strong>

                </div>

            </div>

            <div className="current-athlete-actions">

                <button
                    className="good-lift-btn"
                    onClick={onGoodLift}
                >

                    GOOD LIFT

                </button>

                <button
                    className="no-lift-btn"
                    onClick={onNoLift}
                >

                    NO LIFT

                </button>

            </div>

        </div>

    );

};

export default CurrentAthleteCard;