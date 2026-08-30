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
    currentAthlete,
    currentPhase,

    // =====================================
    // DECLARATION CONTROL
    //
    // These values come from LiveScore.jsx.
    // This component does not own authoritative
    // competition state.
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

    const currentAttempt =
        currentAthlete?.currentAttempt ??
        null;


    const attemptPhase =
        currentAttempt?.phase ??
        currentPhase ??
        null;


    const attemptNo =
        currentAttempt?.attemptNo ??
        null;


    const applicableWeight =
        currentAttempt?.applicableWeight ??
        null;


    const authoritativeDeclaredWeight =
        currentAttempt?.declaredWeight ??
        null;


    // =====================================
    // DECLARATION STATE
    //
    // We only use the parent's editable
    // value for the input.
    //
    // We do NOT calculate a declaration here.
    // =====================================

    const editableDeclaredWeight =
        declaredWeight !== undefined &&
        declaredWeight !== null
            ? declaredWeight
            : authoritativeDeclaredWeight ?? "";


    // =====================================
    // DECLARATION LOCK
    //
    // Only allow editing when the current
    // attempt belongs to the active phase.
    //
    // This is a UI guard.
    //
    // The backend remains responsible for
    // authoritative validation.
    // =====================================

    const declarationLocked =
        Boolean(
            attemptPhase &&
            currentPhase &&
            attemptPhase !== currentPhase
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
    // =====================================

    const handleProcessLift =
        (result) => {

        if (
            processingLift ||
            typeof onProcessLift !==
                "function"
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

    if (!currentAthlete) {

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


                <div
                    className="current-platform-empty"
                >

                    Waiting for the backend to provide
                    the next current athlete.

                </div>

            </section>

        );

    }


    // =====================================
    // CURRENT PLATFORM
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
                            currentAthlete.name ??
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
                ATHLETE / ATTEMPT INFORMATION
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
                            currentAthlete.lotNumber ??
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
                                attemptPhase
                            )
                        }{" "}

                        {
                            attemptNo ??
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
                            applicableWeight != null
                                ? `${applicableWeight} kg`
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
                            authoritativeDeclaredWeight != null
                                ? `${authoritativeDeclaredWeight} kg`
                                : "-"
                        }
                    </strong>

                </div>

            </div>


            {/* =================================
                DECLARATION
            ================================= */}

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
                                    attemptPhase
                                )} attempt ${attemptNo ?? "-"}`
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
                                attemptPhase
                            )} attempt ${attemptNo ?? "-"}.`
                    }
                </small>

            </div>


            {/* =================================
                LIFT DECISION
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

        </section>

    );

};


export default CurrentPlatform;