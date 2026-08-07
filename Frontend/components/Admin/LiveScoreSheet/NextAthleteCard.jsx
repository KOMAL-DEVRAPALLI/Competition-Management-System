const NextAthleteCard = ({
    nextAthlete,
}) => {

    if (!nextAthlete) {

        return (
            <div className="next-athlete-card">

                <div className="next-athlete-header">

                    <h2>Next Athlete</h2>

                </div>

                <div className="next-athlete-empty">

                    No Next Athlete

                </div>

            </div>
        );

    }

    return (

        <div className="next-athlete-card">

            <div className="next-athlete-header">

                <h2>Next Athlete</h2>

            </div>

            <div className="next-athlete-details">

                <div className="next-athlete-row">
                    <span>Name</span>
                    <strong>{nextAthlete.name}</strong>
                </div>

                <div className="next-athlete-row">
                    <span>Lot Number</span>
                    <strong>{nextAthlete.lotNumber}</strong>
                </div>

                <div className="next-athlete-row">
                    <span>Weight Category</span>
                    <strong>{nextAthlete.weightCategory}</strong>
                </div>

                <div className="next-athlete-row">
                    <span>Phase</span>
                    <strong>
                        {nextAthlete.currentAttempt.phase}
                    </strong>
                </div>

                <div className="next-athlete-row">
                    <span>Attempt</span>
                    <strong>
                        {nextAthlete.currentAttempt.attemptNo}
                    </strong>
                </div>

                <div className="next-athlete-row">
                    <span>Declared Weight</span>

                    <strong>
                        {nextAthlete.currentAttempt.declaredWeight ??
                            (
                                nextAthlete.currentAttempt.phase ===
                                "SNATCH"
                                    ? nextAthlete.openingSnatch
                                    : nextAthlete.openingCleanJerk
                            )}{" "}
                        kg
                    </strong>

                </div>

            </div>

        </div>

    );

};

export default NextAthleteCard;