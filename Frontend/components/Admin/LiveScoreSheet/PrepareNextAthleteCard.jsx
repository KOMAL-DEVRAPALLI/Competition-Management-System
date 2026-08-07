import "./PrepareNextAthleteCard.css"
const NextAthleteCard = ({
    nextAthlete,
    declaredWeight,
    setDeclaredWeight,
    onSaveWeight,
}) => {

    if (!nextAthlete) {

        return (

            <div className="next-athlete-card">

                <div className="next-athlete-header">

                    <h2>Prepare Next Attempt</h2>

                </div>

                <div className="next-athlete-empty">

                    No Athlete Waiting

                </div>

            </div>

        );

    }

    const currentWeight =
        nextAthlete.currentAttempt.declaredWeight ??
        (
            nextAthlete.currentAttempt.phase === "SNATCH"
                ? nextAthlete.openingSnatch
                : nextAthlete.openingCleanJerk
        );

    return (

        <div className="next-athlete-card">

            <div className="next-athlete-header">

                <h2>Prepare Next Attempt</h2>

            </div>

            <div className="next-athlete-details">

                <div className="next-athlete-row">

                    <span>Lot Number</span>

                    <strong>{nextAthlete.lotNumber}</strong>

                </div>

                <div className="next-athlete-row">

                    <span>Athlete</span>

                    <strong>{nextAthlete.name}</strong>

                </div>

                <div className="next-athlete-row">

                    <span>Current Attempt</span>

                    <strong>

                        {nextAthlete.currentAttempt.phase} - Attempt {nextAthlete.currentAttempt.attemptNo}

                    </strong>

                </div>

                <div className="next-athlete-row">

                    <span>Current Declaration</span>

                    <strong>{currentWeight} kg</strong>

                </div>

            </div>

            <div className="next-athlete-weight">

                <label>

                    New Declaration

                </label>

                <input
                    className="next-athlete-input"
                    type="number"
                    value={declaredWeight}
                    onChange={(e) =>
                        setDeclaredWeight(e.target.value)
                    }
                />

            </div>

            <div className="next-athlete-actions">

                <button
                    className="save-next-weight-btn"
                    onClick={onSaveWeight}
                >

                    SAVE DECLARATION

                </button>

            </div>

        </div>

    );

};

export default NextAthleteCard;