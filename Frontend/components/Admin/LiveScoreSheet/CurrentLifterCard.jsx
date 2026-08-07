import "./CurrentLiftCard.css"
const CurrentAthleteCard = ({
    currentAthlete,
    onGoodLift,
    onNoLift,
}) => {

    if (!currentAthlete) {
        return (
            <div className="current-athlete-card">
                No Athlete On Platform
            </div>
        );
    }

    return (

        <div className="current-athlete-card">

            <div className="current-athlete-header">

                <h2>
                    Current Lift
                </h2>

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
                    <span>Phase</span>
                    <strong>{currentAthlete.currentAttempt.phase}</strong>
                </div>

                <div className="current-athlete-row">
                    <span>Attempt</span>
                    <strong>{currentAthlete.currentAttempt.attemptNo}</strong>
                </div>

                <div className="current-athlete-row">
                    <span>Weight On Bar</span>
                    <strong>
                        {currentAthlete.currentAttempt.declaredWeight} kg
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