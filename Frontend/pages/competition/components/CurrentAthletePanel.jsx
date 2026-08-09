import "./CompetitionPanel.css";

const CurrentAthletePanel = ({
    currentAthlete,
    currentPhase,

    declaredWeight,
    setDeclaredWeight,

    onSaveDeclaration,
    onProcessLift,

    savingDeclaration,
    processingLift,
}) => {

    const currentAttempt =
        currentAthlete?.currentAttempt ?? null;


    const declarationLocked =
        currentPhase === "SNATCH" &&
        currentAttempt?.phase === "CLEAN_JERK";


    const currentWeight =
        currentAttempt?.declaredWeight;


    return (

        <section className="live-score-current">

            <div className="live-score-current-header">

                <h2>
                    Current Athlete
                </h2>


                {currentAthlete && (

                    <span>
                        ON PLATFORM
                    </span>

                )}

            </div>


            {!currentAthlete ? (

                <div className="live-score-empty">

                    <h2>
                        PLATFORM EMPTY
                    </h2>


                    <p>
                        Official must manually
                        select the next athlete.
                    </p>

                </div>

            ) : (

                <div className="current-athlete-panel">

                    <div className="current-athlete-main">

                        <div>

                            <div className="current-athlete-label">
                                ATHLETE
                            </div>


                            <h1>
                                {
                                    currentAthlete.name
                                }
                            </h1>

                        </div>


                        <div className="current-athlete-meta">

                            <div>

                                <strong>
                                    Lot
                                </strong>


                                <span>
                                    {
                                        currentAthlete
                                            .lotNumber ??
                                        "-"
                                    }
                                </span>

                            </div>


                            <div>

                                <strong>
                                    Attempt
                                </strong>


                                <span>

                                    {
                                        currentAttempt?.phase
                                    }{" "}

                                    {
                                        currentAttempt
                                            ?.attemptNo
                                    }

                                </span>

                            </div>


                            <div>

                                <strong>
                                    Weight
                                </strong>


                                <span>

                                    {
                                        currentWeight ??
                                        "-"
                                    } kg

                                </span>

                            </div>

                        </div>

                    </div>


                    <div className="current-athlete-declaration">

                        <label htmlFor="declared-weight">

                            Declared Weight (kg)

                        </label>


                        <div className="declaration-control">

                            <input
                                id="declared-weight"
                                type="number"
                                min="1"
                                step="1"

                                value={
                                    declaredWeight ?? ""
                                }

                                disabled={
                                    declarationLocked ||
                                    savingDeclaration ||
                                    processingLift
                                }

                                onChange={(event) => {

                                    setDeclaredWeight(
                                        event.target.value
                                    );

                                }}

                            />


                            <button
                                type="button"

                                onClick={
                                    onSaveDeclaration
                                }

                                disabled={
                                    declarationLocked ||
                                    savingDeclaration ||
                                    processingLift ||
                                    !declaredWeight
                                }
                            >

                                {
                                    savingDeclaration
                                        ? "Saving..."
                                        : declarationLocked
                                        ? "C&J Locked"
                                        : "Save Declaration"
                                }

                            </button>

                        </div>


                        <small>

                            {
                                declarationLocked
                                    ? "Clean & Jerk declaration is locked until the global Snatch phase is completed."
                                    : "Enter or modify the declared weight before the lift."
                            }

                        </small>

                    </div>


                    <div className="lift-decision">

                        <button
                            type="button"
                            className="good-btn"

                            disabled={
                                processingLift
                            }

                            onClick={() =>
                                onProcessLift(
                                    "GOOD"
                                )
                            }
                        >

                            GOOD LIFT

                        </button>


                        <button
                            type="button"
                            className="no-lift-btn"

                            disabled={
                                processingLift
                            }

                            onClick={() =>
                                onProcessLift(
                                    "NO_LIFT"
                                )
                            }
                        >

                            NO LIFT

                        </button>

                    </div>

                </div>

            )}

        </section>

    );

};

export default CurrentAthletePanel;