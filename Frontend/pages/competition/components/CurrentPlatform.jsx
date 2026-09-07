import "./CurrentPlatform.css";


const formatPhase = (phase) => {

    if (phase === "CLEAN_JERK") {
        return "C&J";
    }

    if (phase === "SNATCH") {
        return "Snatch";
    }

    return phase ?? "-";

};


const CurrentPlatform = ({
    // =====================================
    // BACKEND-AUTHORITATIVE CALLING CURRENT
    //
    // This is the athlete currently having
    // the highest calling priority.
    //
    // IMPORTANT:
    // This athlete may be different from the
    // athlete physically on the platform during
    // a declaration correction.
    // =====================================

    currentAthlete,

    // =====================================
    // PHYSICAL PLATFORM ATHLETE
    //
    // This is the athlete who is actually
    // performing the lift.
    //
    // Good Lift / No Lift MUST target this
    // athlete.
    // =====================================

    platformAthlete,

    currentPhase,

    // =====================================
    // DECLARATION CONTROL
    //
    // Declaration editing belongs to the
    // backend calling current.
    // =====================================

    declaredWeight,
    setDeclaredWeight,
    onSaveDeclaration,
    savingDeclaration,

    // =====================================
    // LIFT CONTROL
    // =====================================

    onProcessLift,
    processingLift,
}) => {

    // =====================================
    // CALLING CURRENT ATTEMPT
    // =====================================

    const currentAthleteAttempt =
        currentAthlete?.currentAttempt ??
        null;


    const currentAthleteAttemptPhase =
        currentAthleteAttempt?.phase ??
        currentPhase ??
        null;


    const currentAthleteAttemptNo =
        currentAthleteAttempt?.attemptNo ??
        null;


    const currentAthleteApplicableWeight =
        currentAthleteAttempt?.applicableWeight ??
        null;


    const currentAthleteDeclaredWeight =
        currentAthleteAttempt?.declaredWeight ??
        null;


    // =====================================
    // PHYSICAL PLATFORM ATTEMPT
    //
    // This is the attempt whose result is
    // being processed by GOOD / NO LIFT.
    // =====================================

    const platformAttempt =
        platformAthlete?.currentAttempt ??
        null;


    const platformAttemptPhase =
        platformAttempt?.phase ??
        currentPhase ??
        null;


    const platformAttemptNo =
        platformAttempt?.attemptNo ??
        null;


    const platformApplicableWeight =
        platformAttempt?.applicableWeight ??
        null;


    const platformDeclaredWeight =
        platformAttempt?.declaredWeight ??
        null;


    // =====================================
    // DECLARATION STATE
    //
    // The editable declaration belongs to
    // currentAthlete, NOT necessarily the
    // physical platform athlete.
    // =====================================

    const editableDeclaredWeight =
        declaredWeight !== undefined &&
        declaredWeight !== null
            ? declaredWeight
            : currentAthleteDeclaredWeight ?? "";


    // =====================================
    // DECLARATION LOCK
    //
    // Backend remains authoritative.
    //
    // This is only a UI guard.
    // =====================================

    const declarationLocked =
        Boolean(
            currentAthleteAttemptPhase &&
            currentPhase &&
            currentAthleteAttemptPhase !== currentPhase
        );


    // =====================================
    // SAVE DECLARATION
    // =====================================

    const handleSaveDeclaration = () => {

        if (
            savingDeclaration ||
            processingLift ||
            declarationLocked ||
            typeof onSaveDeclaration !==
                "function"
        ) {

            return;

        }


        if (
            editableDeclaredWeight ===
            "" ||
            editableDeclaredWeight ===
            null ||
            editableDeclaredWeight ===
            undefined
        ) {

            return;

        }


        onSaveDeclaration();

    };


    // =====================================
    // PROCESS LIFT
    //
    // LiveScore.jsx is responsible for
    // submitting the platform athlete's
    // entryId.
    //
    // This component must NOT substitute
    // currentAthlete for platformAthlete.
    // =====================================

    const handleProcessLift =
        (result) => {

        if (
            processingLift ||
            typeof onProcessLift !==
                "function" ||
            !platformAthlete
        ) {

            return;

        }


        onProcessLift(
            result
        );

    };


    // =====================================
    // EMPTY PLATFORM
    // =====================================

    if (!platformAthlete) {

        return (

            <section
                className="current-platform"
            >

                <div
                    className="current-platform-header"
                >

                    <div>

                        <span
                            className="current-platform-label"
                        >
                            CURRENT PLATFORM
                        </span>


                        <h2>
                            Platform Empty
                        </h2>

                    </div>


                    <span
                        className="current-platform-status"
                    >
                        AUTOMATIC
                    </span>

                </div>


                {/* =================================
                    CALLING CURRENT MAY STILL EXIST
                ================================= */}

                {currentAthlete && (

                    <div
                        className="current-platform-empty"
                    >

                        <strong>
                            Current Call:{" "}
                            {
                                currentAthlete.name ??
                                "-"
                            }
                        </strong>

                        <br />

                        Waiting for the backend platform
                        state.

                    </div>

                )}


                {!currentAthlete && (

                    <div
                        className="current-platform-empty"
                    >

                        Waiting for the backend to provide
                        the next current athlete.

                    </div>

                )}

            </section>

        );

    }


    // =====================================
    // PHYSICAL PLATFORM
    // =====================================

    return (

        <section
            className="current-platform"
        >

            {/* =================================
                HEADER
            ================================= */}

            <div
                className="current-platform-header"
            >

                <div>

                    <span
                        className="current-platform-label"
                    >
                        CURRENT PLATFORM
                    </span>


                    <h2>
                        {
                            platformAthlete.name ??
                            "-"
                        }
                    </h2>

                </div>


                <span
                    className="current-platform-status"
                >
                    ON PLATFORM
                </span>

            </div>


            {/* =================================
                CALLING CURRENT
            =================================
            
            Normally this will be the same athlete
            as platformAthlete.

            During a declaration correction it may
            intentionally differ.
            ================================= */}

            {currentAthlete &&
                currentAthlete.entryId !==
                platformAthlete.entryId && (

                <div
                    className="current-platform-meta"
                >

                    <div
                        className="current-platform-meta-item"
                    >

                        <span>
                            CURRENT CALL
                        </span>


                        <strong>
                            {
                                currentAthlete.name ??
                                "-"
                            }
                        </strong>

                    </div>


                    <div
                        className="current-platform-meta-item"
                    >

                        <span>
                            LOT
                        </span>


                        <strong>
                            {
                                currentAthlete.lotNumber ??
                                "-"
                            }
                        </strong>

                    </div>


                    <div
                        className="current-platform-meta-item"
                    >

                        <span>
                            ATTEMPT
                        </span>


                        <strong>
                            {
                                formatPhase(
                                    currentAthleteAttemptPhase
                                )
                            }{" "}

                            {
                                currentAthleteAttemptNo ??
                                "-"
                            }
                        </strong>

                    </div>

                </div>

            )}


            {/* =================================
                PLATFORM ATHLETE INFORMATION
            ================================= */}

            <div
                className="current-platform-meta"
            >

                <div
                    className="current-platform-meta-item"
                >

                    <span>
                        LOT
                    </span>


                    <strong>
                        {
                            platformAthlete.lotNumber ??
                            "-"
                        }
                    </strong>

                </div>


                <div
                    className="current-platform-meta-item current-platform-attempt"
                >

                    <span>
                        ATTEMPT
                    </span>


                    <strong>
                        {
                            formatPhase(
                                platformAttemptPhase
                            )
                        }{" "}

                        {
                            platformAttemptNo ??
                            "-"
                        }
                    </strong>

                </div>


                <div
                    className="current-platform-meta-item"
                >

                    <span>
                        APPLICABLE
                    </span>


                    <strong>
                        {
                            platformApplicableWeight != null
                                ? `${platformApplicableWeight} kg`
                                : "-"
                        }
                    </strong>

                </div>


                <div
                    className="current-platform-meta-item"
                >

                    <span>
                        DECLARED
                    </span>


                    <strong>
                        {
                            platformDeclaredWeight != null
                                ? `${platformDeclaredWeight} kg`
                                : "-"
                        }
                    </strong>

                </div>

            </div>


            {/* =================================
                DECLARATION
                =================================
                
                IMPORTANT:

                This editor belongs to the
                backend calling current.

                It does NOT edit the physical
                platform athlete unless they are
                the same athlete.
            ================================= */}

            {currentAthlete && (

                <div
                    className="current-platform-declaration"
                >

                    <div
                        className="current-platform-declaration-label"
                    >

                        <label
                            htmlFor="current-platform-declared-weight"
                        >
                            DECLARATION
                        </label>


                        <span>
                            {
                                declarationLocked
                                    ? "PHASE LOCKED"
                                    : `Edit ${formatPhase(
                                        currentAthleteAttemptPhase
                                    )} attempt ${
                                        currentAthleteAttemptNo ??
                                        "-"
                                    }`
                            }
                        </span>

                    </div>


                    <div
                        className="current-platform-declaration-controls"
                    >

                        <div
                            className="current-platform-input-wrapper"
                        >

                            <input

                                id="current-platform-declared-weight"

                                type="number"

                                min="1"

                                step="1"

                                value={
                                    editableDeclaredWeight
                                }

                                onChange={(event) => {

                                    if (
                                        typeof setDeclaredWeight !==
                                        "function"
                                    ) {

                                        return;

                                    }


                                    setDeclaredWeight(
                                        event.target.value
                                    );

                                }}

                                disabled={
                                    declarationLocked ||
                                    savingDeclaration ||
                                    processingLift
                                }

                                aria-label="Declared weight in kilograms"

                            />


                            <span>
                                kg
                            </span>

                        </div>


                        <button

                            type="button"

                            className="current-platform-save"

                            onClick={
                                handleSaveDeclaration
                            }

                            disabled={
                                declarationLocked ||
                                savingDeclaration ||
                                processingLift ||
                                !editableDeclaredWeight
                            }

                        >

                            {
                                savingDeclaration
                                    ? "SAVING..."
                                    : "SAVE"
                            }

                        </button>

                    </div>


                    <small>
                        {
                            declarationLocked

                                ? `Declaration is locked because the current attempt is outside the ${formatPhase(
                                    currentPhase
                                )} phase.`

                                : `Declared weight for ${formatPhase(
                                    currentAthleteAttemptPhase
                                )} attempt ${
                                    currentAthleteAttemptNo ??
                                    "-"
                                }.`
                        }
                    </small>

                </div>

            )}


            {/* =================================
                LIFT DECISION
                =================================

                GOOD / NO LIFT belongs to the
                PHYSICAL PLATFORM ATHLETE.
            ================================= */}

            <div
                className="current-platform-actions"
            >

                <button

                    type="button"

                    className="current-platform-good"

                    disabled={
                        processingLift ||
                        savingDeclaration
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


                <button

                    type="button"

                    className="current-platform-no-lift"

                    disabled={
                        processingLift ||
                        savingDeclaration
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
                STATE DIFFERENCE NOTICE
            ================================= */}

            {currentAthlete &&
                currentAthlete.entryId !==
                platformAthlete.entryId && (

                <div
                    className="current-platform-empty"
                >

                    Calling priority has changed.
                    <br />

                    <strong>
                        Current Call:
                    </strong>{" "}
                    {
                        currentAthlete.name ??
                        "-"
                    }

                    <br />

                    <strong>
                        On Platform:
                    </strong>{" "}
                    {
                        platformAthlete.name ??
                        "-"
                    }

                </div>

            )}

        </section>

    );

};


export default CurrentPlatform;