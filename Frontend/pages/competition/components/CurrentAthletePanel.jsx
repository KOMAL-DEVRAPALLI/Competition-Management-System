import "./CompetitionPanel.css";

const CurrentAthletePanel = ({
    currentAthlete,

    declaredWeight,
    setDeclaredWeight,

    onSaveDeclaration,
    onProcessLift,

    savingDeclaration,
    processingLift,
}) => {

    // =====================================
    // CURRENT ATTEMPT
    // =====================================

    const currentAttempt =
        currentAthlete?.currentAttempt ?? null;


    // =====================================
    // CURRENT WEIGHT
    //
    // This is the currently declared weight.
    // =====================================

    const currentWeight =
        currentAttempt?.declaredWeight;


    // =====================================
    // RENDER
    // =====================================

    return (

        <section className="live-score-current">

            {/* =================================
                HEADER
            ================================= */}

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


            {/* =================================
                EMPTY PLATFORM
            ================================= */}

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

                    {/* =============================
                        ATHLETE INFORMATION
                    ============================= */}

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


                        {/* =============================
                            ATHLETE META
                        ============================= */}

                        <div className="current-athlete-meta">

                            {/* LOT */}

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


                            {/* ATTEMPT */}

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


                            {/* WEIGHT */}

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


                    {/* =============================
                        DECLARATION
                    ============================= */}

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
                                    savingDeclaration ||
                                    processingLift ||
                                    !declaredWeight
                                }
                            >

                                {
                                    savingDeclaration
                                        ? "Saving..."
                                        : "Save Declaration"
                                }

                            </button>

                        </div>


                        {/* =============================
                            DECLARATION INFORMATION
                        ============================= */}

                        <small>

                            Enter or modify the declared
                            weight before the lift.

                        </small>

                    </div>


                    {/* =============================
                        LIFT CONTROLS
                    ============================= */}

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