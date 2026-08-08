import "./CompetitionPanel.css"
const CurrentAthletePanel = ({
    currentAthlete,
    currentAttempt,
    currentWeight,
    declaredWeight,
    isAttemptOne,
    savingDeclaration,
    processingLift,
    onDeclaredWeightChange,
    onSaveDeclaration,
    onProcessLift,
}) => {

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

                    {/* =========================
                        ATHLETE INFORMATION
                    ========================= */}

                    <div className="current-athlete-main">

                        <div>

                            <div className="current-athlete-label">
                                ATHLETE
                            </div>

                            <h1>
                                {currentAthlete.name}
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
                                            .lotNumber
                                    }
                                </span>
                            </div>

                            <div>
                                <strong>
                                    Attempt
                                </strong>

                                <span>
                                    {
                                        currentAttempt
                                            ?.phase
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

                    {/* =========================
                        DECLARATION
                    ========================= */}

                    <div className="current-athlete-declaration">

                        <label>
                            Declared Weight (kg)
                        </label>

                        <div className="declaration-control">

                            <input
                                type="number"
                                min="1"
                                value={
                                    declaredWeight
                                }
                                disabled={
                                    isAttemptOne ||
                                    savingDeclaration ||
                                    processingLift
                                }
                                onChange={(event) =>
                                    onDeclaredWeightChange(
                                        event.target.value
                                    )
                                }
                            />

                            <button
                                type="button"
                                onClick={
                                    onSaveDeclaration
                                }
                                disabled={
                                    isAttemptOne ||
                                    savingDeclaration ||
                                    processingLift ||
                                    !declaredWeight
                                }
                            >
                                {savingDeclaration
                                    ? "Saving..."
                                    : "Save Declaration"}
                            </button>

                        </div>

                        {isAttemptOne && (
                            <small>
                                Attempt 1 uses the
                                opening weight.
                            </small>
                        )}

                    </div>

                    {/* =========================
                        LIFT CONTROLS
                    ========================= */}

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