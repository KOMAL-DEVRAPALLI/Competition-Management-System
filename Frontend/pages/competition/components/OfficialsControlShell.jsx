import CurrentPlatform from "./CurrentPlatform";

import "./OfficialsControlShell.css";


// =====================================
// FORMAT PHASE
// =====================================

const formatPhase = (phase) => {

    if (phase === "CLEAN_JERK") {
        return "C&J";
    }

    if (phase === "SNATCH") {
        return "Snatch";
    }

    return phase ?? "-";

};


// =====================================
// FORMAT ATTEMPT
// =====================================

const formatAttempt = (attempt) => {

    if (!attempt) {
        return "-";
    }

    return `${formatPhase(attempt.phase)} ${attempt.attemptNo ?? "-"}`;

};


// =====================================
// OFFICIALS CONTROL SHELL
// =====================================

const OfficialsControlShell = ({

    currentAthlete,

    currentPhase,


    // =====================================
    // CURRENT ATHLETE DECLARATION
    // =====================================

    declaredWeight,

    setDeclaredWeight,

    onSaveDeclaration,

    savingDeclaration,


    // =====================================
    // LIFT ACTION
    // =====================================

    onProcessLift,

    processingLift,


    // =====================================
    // NEXT ATTEMPT DECLARATION
    // =====================================

    justCompleted,

    nextAttemptDeclaredWeight,

    setNextAttemptDeclaredWeight,

    onSaveNextAttemptAllocation,

    savingNextAttemptAllocation,


    // =====================================
    // BACKEND-AUTHORITATIVE QUEUE STATE
    // =====================================

    nextAthlete,

    upcomingAthletes = [],

}) => {


    // =====================================
    // COMPLETED ATTEMPT
    //
    // IMPORTANT:
    //
    // The backend returns:
    //
    // justCompleted.completedAttempt
    //
    // =====================================

    const completedAttempt =
        justCompleted?.completedAttempt ??
        null;


    // =====================================
    // COMPLETED ATHLETE'S NEXT ATTEMPT
    //
    // IMPORTANT:
    //
    // processLift.js returns:
    //
    // justCompleted.nextAttempt
    //
    // NOT:
    //
    // justCompleted.completedAthleteNextAttempt
    // =====================================

    const completedAthleteNextAttempt =
        justCompleted?.nextAttempt ??
        null;


    // =====================================
    // COMPLETED ATHLETE'S NEXT WEIGHT
    //
    // Prefer the authoritative nextAttemptState
    // returned by processLift().
    //
    // Fall back to the next attempt's existing
    // declaredWeight if necessary.
    // =====================================

    const completedAthleteNextAttemptWeight =
        justCompleted?.nextAttemptState?.weight ??
        completedAthleteNextAttempt?.declaredWeight ??
        null;


    // =====================================
    // COMPLETED ATHLETE LOT NUMBER
    // =====================================

    const completedAthleteLotNumber =
        justCompleted?.athlete?.official?.lotNumber ??
        null;


    // =====================================
    // NEXT ATTEMPT AVAILABLE?
    // =====================================

    const hasNextAttempt =
        Boolean(
            completedAthleteNextAttempt
        );


    // =====================================
    // CONTROLLED ALLOCATION VALUE
    //
    // The parent controls the editing value.
    //
    // If no local value has been initialized,
    // use the authoritative backend value.
    // =====================================

    const allocationWeight =
        nextAttemptDeclaredWeight ??
        completedAthleteNextAttemptWeight ??
        "";


    return (

        <section
            className="officials-control-shell"
        >

            {/* =================================
                CURRENT + NEXT DECLARATION
            ================================= */}

            <div
                className="officials-control-main"
            >


                {/* =================================
                    CURRENT PLATFORM
                ================================= */}

                <div
                    className="officials-control-current"
                >

                    <CurrentPlatform

                        currentAthlete={
                            currentAthlete
                        }

                        currentPhase={
                            currentPhase
                        }

                        declaredWeight={
                            declaredWeight
                        }

                        setDeclaredWeight={
                            setDeclaredWeight
                        }

                        onSaveDeclaration={
                            onSaveDeclaration
                        }

                        savingDeclaration={
                            savingDeclaration
                        }

                        onProcessLift={
                            onProcessLift
                        }

                        processingLift={
                            processingLift
                        }

                    />

                </div>


                {/* =================================
                    NEXT DECLARATION SIDE CARD
                ================================= */}

                <div
                    className="officials-control-just-completed"
                >

                    <div
                        className="officials-control-title-row"
                    >

                        <span
                            className="officials-control-label"
                        >
                            NEXT DECLARATION
                        </span>

                    </div>


                    {justCompleted ? (

                        <div
                            className="officials-control-completed-content"
                        >


                            {/* =================================
                                COMPLETED ATHLETE
                            ================================= */}

                            <div
                                className="officials-control-athlete-name"
                            >

                                {
                                    justCompleted.athlete?.name ??
                                    justCompleted.name ??
                                    "-"
                                }

                            </div>


                            {/* =================================
                                LOT NUMBER
                            ================================= */}

                            <div
                                className="officials-control-completed-meta"
                            >

                                <span>
                                    {
                                        completedAthleteLotNumber != null
                                            ? `Lot ${completedAthleteLotNumber}`
                                            : "Lot -"
                                    }
                                </span>

                            </div>


                            {/* =================================
                                COMPLETED ATTEMPT + RESULT
                            ================================= */}

                            <div
                                className="officials-control-completed-meta"
                            >

                                <strong>
                                    {
                                        formatAttempt(
                                            completedAttempt
                                        )
                                    }
                                </strong>


                                <span
                                    className={
                                        completedAttempt?.result ===
                                        "GOOD"

                                            ? "officials-control-result-good"

                                            : completedAttempt?.result ===
                                              "NO_LIFT"

                                                ? "officials-control-result-no-lift"

                                                : ""
                                    }
                                >

                                    {
                                        completedAttempt?.result ===
                                        "NO_LIFT"

                                            ? "NO LIFT"

                                            : completedAttempt?.result ??
                                              "-"
                                    }

                                </span>

                            </div>


                            {/* =================================
                                NEXT ATTEMPT
                            ================================= */}

                            {hasNextAttempt ? (

                                <div
                                    className="officials-control-next-attempt"
                                >


                                    {/* =================================
                                        NEXT ATTEMPT LABEL
                                    ================================= */}

                                    <div
                                        className="officials-control-next-attempt-label"
                                    >
                                        NEXT ATTEMPT
                                    </div>


                                    {/* =================================
                                        NEXT ATTEMPT NUMBER
                                    ================================= */}

                                    <div
                                        className="officials-control-next-attempt-name"
                                    >

                                        {
                                            formatAttempt(
                                                completedAthleteNextAttempt
                                            )
                                        }

                                    </div>


                                    {/* =================================
                                        DECLARATION EDITOR
                                    ================================= */}

                                    <div
                                        className="officials-control-next-attempt-editor"
                                    >


                                        {/* =================================
                                            WEIGHT INPUT
                                        ================================= */}

                                        <div
                                            className="officials-control-next-attempt-input-wrapper"
                                        >

                                            <input

                                                type="number"

                                                min="1"

                                                step="1"

                                                value={
                                                    allocationWeight
                                                }

                                                onChange={
                                                    (event) =>
                                                        setNextAttemptDeclaredWeight(
                                                            event.target.value
                                                        )
                                                }

                                                disabled={
                                                    savingNextAttemptAllocation
                                                }

                                                aria-label="Next attempt declared weight"

                                            />

                                            <span>
                                                kg
                                            </span>

                                        </div>


                                        {/* =================================
                                            SAVE DECLARATION
                                        ================================= */}

                                        <button

                                            type="button"

                                            onClick={
                                                onSaveNextAttemptAllocation
                                            }

                                            disabled={
                                                savingNextAttemptAllocation ||
                                                !allocationWeight
                                            }

                                        >

                                            {
                                                savingNextAttemptAllocation

                                                    ? "SAVING..."

                                                    : "SAVE DECLARATION"
                                            }

                                        </button>

                                    </div>

                                </div>

                            ) : (

                                <div
                                    className="officials-control-next-attempt"
                                >

                                    <span>
                                        No further attempt
                                    </span>

                                </div>

                            )}

                        </div>

                    ) : (

                        <div
                            className="officials-control-empty"
                        >
                            No completed lift yet
                        </div>

                    )}

                </div>

            </div>


            {/* =================================
                BACKEND-AUTHORITATIVE CALLING ORDER
            ================================= */}

            <div
                className="officials-control-calling"
            >


                {/* =================================
                    NEXT ATHLETE
                ================================= */}

                <div
                    className="officials-control-next"
                >

                    <span
                        className="officials-control-label"
                    >
                        NEXT
                    </span>


                    <div
                        className="officials-control-next-name"
                    >

                        {
                            nextAthlete?.name ??
                            "-"
                        }

                    </div>


                    <div
                        className="officials-control-next-meta"
                    >

                        {
                            nextAthlete?.lotNumber != null

                                ? `Lot ${nextAthlete.lotNumber}`

                                : "Lot -"
                        }


                        {
                            nextAthlete?.attemptNo != null

                                ? ` · ${formatPhase(
                                    nextAthlete.phase
                                )} ${nextAthlete.attemptNo}`

                                : ""
                        }

                    </div>

                </div>


                {/* =================================
                    UPCOMING ATHLETES
                ================================= */}

                <div
                    className="officials-control-upcoming"
                >

                    <span
                        className="officials-control-label"
                    >
                        UPCOMING
                    </span>


                    <div
                        className="officials-control-upcoming-list"
                    >

                        {
                            upcomingAthletes.length > 0

                                ? upcomingAthletes.map(
                                    (athlete) => (

                                        <span

                                            key={
                                                athlete.entryId
                                            }

                                            className="officials-control-upcoming-item"
                                        >

                                            <strong>
                                                {
                                                    athlete.name ??
                                                    "-"
                                                }
                                            </strong>


                                            {
                                                athlete.lotNumber !=
                                                null && (

                                                    <small>
                                                        Lot{" "}
                                                        {
                                                            athlete.lotNumber
                                                        }
                                                    </small>

                                                )
                                            }

                                        </span>

                                    )
                                )

                                : (

                                    <span
                                        className="officials-control-empty"
                                    >
                                        -
                                    </span>

                                )
                        }

                    </div>

                </div>

            </div>

        </section>

    );

};


export default OfficialsControlShell;