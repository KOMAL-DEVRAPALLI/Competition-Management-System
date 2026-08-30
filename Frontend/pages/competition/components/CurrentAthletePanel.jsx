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

    // =====================================
    // AUTHORITATIVE CURRENT ATTEMPT
    //
    // Live attempt state is exposed by the
    // backend through:
    //
    // currentAthlete.currentAttempt
    //
    // Do NOT read phase, attempt number or
    // declared weight directly from
    // currentAthlete.
    // =====================================

    const currentAttempt =
        currentAthlete?.currentAttempt ?? null;


    const attemptPhase =
        currentAttempt?.phase ?? null;


    const attemptNo =
        currentAttempt?.attemptNo ?? null;


    const currentWeight =
        currentAttempt?.declaredWeight ?? null;


    const applicableWeight =
        currentAttempt?.applicableWeight ?? null;


    // =====================================
    // DECLARATION LOCK
    //
    // The declaration control is available
    // only when the athlete's current attempt
    // belongs to the active competition phase.
    // =====================================

    const declarationLocked =
        Boolean(
            currentPhase &&
            attemptPhase &&
            currentPhase !== attemptPhase
        );


    // =====================================
    // PLATFORM EMPTY
    // =====================================

    if (!currentAthlete) {

        return (

            <section className="live-score-current">

                <div className="live-score-current-header">

                    <h2>
                        Current Athlete
                    </h2>

                    <span>
                        AUTOMATIC QUEUE
                    </span>

                </div>


                <div className="live-score-empty">

                    <h2>
                        PLATFORM EMPTY
                    </h2>


                    <p>
                        The next athlete is determined
                        automatically by the competition
                        queue.
                    </p>

                </div>

            </section>

        );

    }


    // =====================================
    // SAVE DECLARATION
    // =====================================

    const handleSaveDeclaration = () => {

        if (
            typeof onSaveDeclaration !==
            "function"
        ) {

            return;

        }


        onSaveDeclaration();

    };


    // =====================================
    // PROCESS LIFT
    // =====================================

    const handleProcessLift =
        (result) => {

        if (
            processingLift
        ) {

            return;

        }


        if (
            typeof onProcessLift !==
            "function"
        ) {

            return;

        }


        onProcessLift(
            result
        );

    };


    return (

        <section className="live-score-current">


            {/* =================================
                HEADER
            ================================= */}

            <div className="live-score-current-header">

                <div>

                    <h2>
                        Current Athlete
                    </h2>

                </div>


                <span>
                    ON PLATFORM
                </span>

            </div>


            {/* =================================
                CURRENT ATHLETE
            ================================= */}

            <div className="current-athlete-panel">


                {/* =================================
                    MAIN ATHLETE INFORMATION
                ================================= */}

                <div className="current-athlete-main">

                    <div>

                        <div className="current-athlete-label">
                            ATHLETE
                        </div>


                        <h1>
                            {
                                currentAthlete.name ??
                                "-"
                            }
                        </h1>

                    </div>


                    {/* =================================
                        META INFORMATION
                    ================================= */}

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
                                    attemptPhase ===
                                    "CLEAN_JERK"
                                        ? "C&J"
                                        : attemptPhase ??
                                          "-"
                                }

                                {" "}

                                {
                                    attemptNo ??
                                    "-"
                                }

                            </span>

                        </div>


                        {/* APPLICABLE WEIGHT */}

                        <div>

                            <strong>
                                Applicable
                            </strong>


                            <span>

                                {
                                    applicableWeight != null
                                        ? `${applicableWeight} kg`
                                        : "-"
                                }

                            </span>

                        </div>


                        {/* DECLARED WEIGHT */}

                        <div>

                            <strong>
                                Declared
                            </strong>


                            <span>

                                {
                                    currentWeight != null
                                        ? `${currentWeight} kg`
                                        : "-"
                                }

                            </span>

                        </div>

                    </div>

                </div>


                {/* =================================
                    DECLARATION
                ================================= */}

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

                                declaredWeight !== null &&
                                declaredWeight !== undefined &&
                                declaredWeight !== ""
                                    ? declaredWeight
                                    : currentWeight ?? ""

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
                                handleSaveDeclaration
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
                                    ? "Phase Locked"
                                    : "Save Declaration"

                            }

                        </button>

                    </div>


                    <small>

                        {

                            declarationLocked

                                ? `Declaration is locked because the athlete's current attempt is ${attemptPhase ?? "outside the active phase"}.`

                                : `Edit the declared weight for ${attemptPhase === "CLEAN_JERK" ? "Clean & Jerk" : "Snatch"} attempt ${attemptNo ?? "-"}.`

                        }

                    </small>

                </div>


                {/* =================================
                    LIFT DECISION
                ================================= */}

                <div className="lift-decision">


                    {/* GOOD LIFT */}

                    <button

                        type="button"

                        className="good-btn"

                        disabled={
                            processingLift
                        }

                        onClick={() =>
                            handleProcessLift(
                                "GOOD"
                            )
                        }

                    >

                        {

                            processingLift
                                ? "PROCESSING..."
                                : "GOOD LIFT"

                        }

                    </button>


                    {/* NO LIFT */}

                    <button

                        type="button"

                        className="no-lift-btn"

                        disabled={
                            processingLift
                        }

                        onClick={() =>
                            handleProcessLift(
                                "NO_LIFT"
                            )
                        }

                    >

                        {

                            processingLift
                                ? "PROCESSING..."
                                : "NO LIFT"

                        }

                    </button>

                </div>


                {/* =================================
                    AUTOMATIC ADVANCEMENT NOTICE
                ================================= */}

                <div
                    className="automatic-advancement-notice"
                >

                </div>

            </div>

        </section>

    );

};


export default CurrentAthletePanel;