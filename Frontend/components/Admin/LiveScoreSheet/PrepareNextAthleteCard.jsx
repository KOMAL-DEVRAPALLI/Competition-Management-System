import "./PrepareNextAthleteCard.css";

const PrepareNextAttemptCard = ({
    prepareAthlete,
    declaredWeight,
    setDeclaredWeight,
    onSaveWeight,
    savingDeclaration,
}) => {

    if (!prepareAthlete) {

        return (

            <div className="next-athlete-card">

                <div className="next-athlete-header">

                    <h2>
                        Prepare Next Attempt
                    </h2>

                </div>

                <div className="next-athlete-empty">

                    No Athlete Waiting For Declaration

                </div>

            </div>

        );

    }

    const currentWeight =
        prepareAthlete.currentAttempt.declaredWeight ??
        (
            prepareAthlete.currentAttempt.phase === "SNATCH"
                ? prepareAthlete.openingSnatch
                : prepareAthlete.openingCleanJerk
        );

    const invalidWeight =
        declaredWeight === "" ||
        Number(declaredWeight) <= 0;

    return (

        <div className="next-athlete-card">

            <div className="next-athlete-header">

                <h2>
                    Prepare Next Attempt
                </h2>

            </div>

            <div className="next-athlete-details">

                <div className="next-athlete-row">

                    <span>
                        Lot Number
                    </span>

                    <strong>
                        {prepareAthlete.lotNumber}
                    </strong>

                </div>

                <div className="next-athlete-row">

                    <span>
                        Athlete
                    </span>

                    <strong>
                        {prepareAthlete.name}
                    </strong>

                </div>

                <div className="next-athlete-row">

                    <span>
                        Next Attempt
                    </span>

                    <strong>

                        {prepareAthlete.currentAttempt.phase}
                        {" "}
                        Attempt
                        {" "}
                        {prepareAthlete.currentAttempt.attemptNo}

                    </strong>

                </div>

                <div className="next-athlete-row">

                    <span>
                        Previous Declaration
                    </span>

                    <strong>

                        {currentWeight != null
                            ? `${currentWeight} kg`
                            : "-"}

                    </strong>

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
                        setDeclaredWeight(
                            e.target.value
                        )
                    }
                    disabled={savingDeclaration}
                />

            </div>

            <div className="next-athlete-actions">

                <button
                    className="save-next-weight-btn"
                    onClick={onSaveWeight}
                    disabled={
                        savingDeclaration ||
                        invalidWeight
                    }
                >

                    {savingDeclaration
                        ? "SAVING..."
                        : "SAVE DECLARATION"}

                </button>

            </div>

        </div>

    );

};

export default PrepareNextAttemptCard;