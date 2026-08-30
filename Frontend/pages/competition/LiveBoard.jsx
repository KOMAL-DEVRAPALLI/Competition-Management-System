import React, {
    useEffect,
    useState,
    useRef,
} from "react";

import { useParams } from "react-router-dom";

import { apiRequest } from "../../api/axios";

import "./LiveScoreBoard.css";


const LiveScoreBoard = () => {

    const {
        competitionId,
        gender,
    } = useParams();


    // =====================================
    // CURRENT ATHLETE ROW
    //
    // Used only for TV auto-scroll.
    // =====================================

    const currentRowRef =
        useRef(null);


    // =====================================
    // PREVIOUS CURRENT ATHLETE
    // =====================================

    const previousCurrentAthleteIdRef =
        useRef(undefined);


    // =====================================
    // LIVE COMPETITION RESULT STATE
    //
    // This remains the source for:
    //
    // - athlete rows
    // - attempts
    // - best lifts
    // - totals
    // - rankings
    //
    // IMPORTANT:
    //
    // We do NOT replace this with queue
    // data.
    // =====================================

    const [liveCompetition, setLiveCompetition] =
        useState(null);


    // =====================================
    // AUTHORITATIVE QUEUE STATE
    //
    // Source:
    //
    // GET /live-competition/:competitionId/
    //     :gender/queue
    //
    // This controls:
    //
    // - current athlete
    // - next athlete
    // - upcoming athletes
    // - authoritative phase
    // - stateVersion
    //
    // It is read-only.
    // =====================================

    const [queueState, setQueueState] =
        useState(null);


    // =====================================
    // LOAD SCOREBOARD
    //
    // Existing endpoint.
    //
    // READ ONLY.
    // =====================================

    const loadScoreBoard = async () => {

        try {

            const response =
                await apiRequest(
                    `/live-competition/${competitionId}/${gender}`,
                    "GET"
                );

            setLiveCompetition(
                response.data
            );

        } catch (error) {

            console.error(
                "Failed to load live scoreboard:",
                error
            );

        }

    };


    // =====================================
    // LOAD AUTHORITATIVE QUEUE
    //
    // NEW AUTOMATIC CALLING ORDER SOURCE.
    //
    // READ ONLY.
    // =====================================

    const loadQueueState = async () => {

        try {

            const response =
                await apiRequest(
                    `/live-competition/${competitionId}/${gender}/queue`,
                    "GET"
                );

            setQueueState(
                response.data
            );

        } catch (error) {

            console.error(
                "Failed to load authoritative queue:",
                error
            );

        }

    };


    // =====================================
    // LIVE POLLING
    //
    // Both endpoints are read-only.
    //
    // The scoreboard never controls
    // competition progression.
    // =====================================

    useEffect(() => {

        if (
            !competitionId ||
            !gender
        ) {

            return;

        }


        loadScoreBoard();
        loadQueueState();


        const interval =
            setInterval(() => {

                loadScoreBoard();
                loadQueueState();

            }, 2000);


        return () => {

            clearInterval(
                interval
            );

        };

    }, [
        competitionId,
        gender,
    ]);


    // =====================================
    // AUTHORITATIVE CURRENT ATHLETE
    //
    // Queue state is now authoritative.
    // =====================================

    const currentAthlete =
        queueState?.current ??
        null;


    // =====================================
    // AUTHORITATIVE NEXT ATHLETE
    // =====================================

    const nextAthlete =
        queueState?.next ??
        null;


    // =====================================
    // AUTHORITATIVE CURRENT PHASE
    // =====================================

    const currentPhase =
        queueState?.currentPhase ??
        liveCompetition?.currentPhase ??
        null;


    // =====================================
    // AUTO-SCROLL
    //
    // Scroll ONLY when the authoritative
    // current athlete changes.
    //
    // Do NOT scroll for:
    //
    // - initial load
    // - declaration changes
    // - GOOD LIFT
    // - NO LIFT
    // - same athlete's next attempt
    // - polling
    // =====================================

    useEffect(() => {

        const currentAthleteId =
            currentAthlete
                ?.entryId
                ?.toString() ??
            null;


        // ---------------------------------
        // FIRST DATA LOAD
        // ---------------------------------

        if (
            previousCurrentAthleteIdRef.current ===
            undefined
        ) {

            previousCurrentAthleteIdRef.current =
                currentAthleteId;

            return;

        }


        // ---------------------------------
        // ATHLETE CHANGED
        // ---------------------------------

        if (
            currentAthleteId &&
            currentAthleteId !==
                previousCurrentAthleteIdRef.current
        ) {

            requestAnimationFrame(() => {

                currentRowRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });

            });

        }


        // ---------------------------------
        // REMEMBER CURRENT ATHLETE
        // ---------------------------------

        previousCurrentAthleteIdRef.current =
            currentAthleteId;

    }, [
        currentAthlete?.entryId,
    ]);


    // =====================================
    // LOADING
    // =====================================

    if (!liveCompetition) {

        return (
            <h2>
                Loading...
            </h2>
        );

    }


    // =====================================
    // RENDER ATTEMPT
    // =====================================

    const renderAttempt = (
        attempt,
        openingWeight
    ) => {

        if (!attempt) {

            return "-";

        }


        let weight =
            attempt.declaredWeight;


        // =================================
        // ATTEMPT 1
        //
        // Opening weight fallback.
        // =================================

        if (
            attempt.attemptNo === 1 &&
            (
                weight === 0 ||
                weight == null
            )
        ) {

            weight =
                openingWeight;

        }


        if (!weight) {

            return "-";

        }


        // =================================
        // RESULT
        // =================================

        switch (
            attempt.result
        ) {

            case "GOOD":

                return (

                    <span className="good-lift">

                        {weight} ✓

                    </span>

                );


            case "NO_LIFT":

                return (

                    <span className="no-lift">

                        ({weight})

                    </span>

                );


            default:

                return (

                    <span className="pending-lift">

                        {weight}

                    </span>

                );

        }

    };


    // =====================================
    // CURRENT ATTEMPT HIGHLIGHT
    //
    // IMPORTANT:
    //
    // Athlete identity comes from the
    // authoritative queue.
    //
    // Attempt information comes from the
    // athlete's existing result row.
    // =====================================

    const isCurrentAttempt = (
        athlete,
        phase,
        attemptNo
    ) => {

        if (!currentAthlete) {

            return false;

        }


        return (

            athlete.entryId?.toString() ===
                currentAthlete.entryId?.toString() &&

            currentAthlete.phase ===
                phase &&

            Number(
                currentAthlete.attemptNo
            ) ===
                Number(attemptNo)

        );

    };


    // =====================================
    // GROUP RESULTS BY WEIGHT CATEGORY
    //
    // EXISTING ATHLETE DATA IS PRESERVED.
    // =====================================

    const competitionResults =
        Array.isArray(
            liveCompetition.competitionResults
        )
            ? liveCompetition.competitionResults
            : [];


    const groupedResults =
        competitionResults.reduce(
            (
                groups,
                athlete
            ) => {

                const weight =
                    athlete.weightCategory;


                if (!groups[weight]) {

                    groups[weight] =
                        [];

                }


                groups[weight].push(
                    athlete
                );


                return groups;

            },
            {}
        );


    // =====================================
    // SORT WEIGHT CATEGORIES
    // =====================================

    const sortedCategories =
        Object.entries(
            groupedResults
        ).sort(
            ([a], [b]) => {

                const weightA =
                    Number(
                        String(a)
                            .replace(
                                "+",
                                ""
                            )
                    );


                const weightB =
                    Number(
                        String(b)
                            .replace(
                                "+",
                                ""
                            )
                    );


                if (
                    weightA !==
                    weightB
                ) {

                    return (
                        weightA -
                        weightB
                    );

                }


                if (
                    a.startsWith("+") &&
                    !b.startsWith("+")
                ) {

                    return 1;

                }


                if (
                    !a.startsWith("+") &&
                    b.startsWith("+")
                ) {

                    return -1;

                }


                return 0;

            }
        );


    // =====================================
    // RENDER
    // =====================================

    return (

        <div className="scoreboard">


            {/* =================================
                HEADER
            ================================= */}

            <header className="header">

                <h1 className="competition-title">

                    SDWA DISTRICT WEIGHTLIFTING
                    CHAMPIONSHIP

                </h1>


                <div className="header-info">

                    <span>

                        {
                            gender === "female"
                                ? "WOMEN"
                                : "MEN"
                        }

                    </span>


                    <span>
                        |
                    </span>


                    <span>

                        {
                            currentPhase ??
                            "-"
                        }

                    </span>


                    <span>
                        |
                    </span>


                    <span>

                        ATT.{" "}

                        {
                            currentAthlete
                                ?.attemptNo ??
                            "-"
                        }

                    </span>

                </div>

            </header>


            {/* =================================
                CONTENT
            ================================= */}

            <div className="content">

                <main className="table-area">

                    <table className="score-table">


                        {/* =================================
                            COLUMN DEFINITIONS
                        ================================= */}

                        <colgroup>

                            <col className="col-lot" />

                            <col className="col-athlete" />

                            <col className="col-attempt" />
                            <col className="col-attempt" />
                            <col className="col-attempt" />
                            <col className="col-best" />

                            <col className="col-attempt" />
                            <col className="col-attempt" />
                            <col className="col-attempt" />
                            <col className="col-best" />

                            <col className="col-total" />

                            <col className="col-rank" />

                        </colgroup>


                        {/* =================================
                            TABLE HEADER
                        ================================= */}

                        <thead>

                            <tr>

                                <th rowSpan="2">
                                    Lot
                                </th>

                                <th rowSpan="2">
                                    Athlete
                                </th>

                                <th colSpan="4">
                                    SNATCH
                                </th>

                                <th colSpan="4">
                                    CLEAN & JERK
                                </th>

                                <th rowSpan="2">
                                    Total
                                </th>

                                <th rowSpan="2">
                                    Rank
                                </th>

                            </tr>


                            <tr>

                                <th>
                                    1
                                </th>

                                <th>
                                    2
                                </th>

                                <th>
                                    3
                                </th>

                                <th>
                                    B
                                </th>


                                <th>
                                    1
                                </th>

                                <th>
                                    2
                                </th>

                                <th>
                                    3
                                </th>

                                <th>
                                    B
                                </th>

                            </tr>

                        </thead>


                        {/* =================================
                            TABLE BODY
                        ================================= */}

                        <tbody>

                            {
                                sortedCategories.map(
                                    (
                                        [
                                            weight,
                                            athletes,
                                        ]
                                    ) => (

                                        <React.Fragment
                                            key={weight}
                                        >


                                            {/* =============================
                                                CATEGORY HEADER
                                            ============================== */}

                                            <tr className="category-row">

                                                <td
                                                    colSpan="12"
                                                >

                                                    <div className="category-header">

                                                        <div className="category-left">

                                                            Weight Category :{" "}

                                                            <strong>
                                                                {weight} kg
                                                            </strong>

                                                        </div>

                                                    </div>

                                                </td>

                                            </tr>


                                            {/* =============================
                                                ATHLETES
                                            ============================== */}

                                            {
                                                athletes.map(
                                                    (
                                                        athlete
                                                    ) => {

                                                        const athleteId =
                                                            athlete.entryId
                                                                ?.toString();


                                                        const currentId =
                                                            currentAthlete
                                                                ?.entryId
                                                                ?.toString();


                                                        const nextId =
                                                            nextAthlete
                                                                ?.entryId
                                                                ?.toString();


                                                        const isCurrent =
                                                            Boolean(
                                                                athleteId &&
                                                                currentId &&
                                                                athleteId ===
                                                                    currentId
                                                            );


                                                        const isNext =
                                                            Boolean(
                                                                athleteId &&
                                                                nextId &&
                                                                athleteId ===
                                                                    nextId
                                                            );


                                                        return (

                                                            <tr
                                                                key={
                                                                    athlete.entryId
                                                                }

                                                                ref={
                                                                    isCurrent
                                                                        ? currentRowRef
                                                                        : null
                                                                }

                                                                className={
                                                                    isCurrent
                                                                        ? "current-athlete-row"
                                                                        : isNext
                                                                        ? "next-athlete-row"
                                                                        : ""
                                                                }
                                                            >


                                                                {/* LOT */}

                                                                <td>

                                                                    {
                                                                        athlete.lotNumber
                                                                    }

                                                                </td>


                                                                {/* ATHLETE */}

                                                                <td
                                                                    className="athlete-name"
                                                                    title={
                                                                        athlete.name
                                                                    }
                                                                >

                                                                    {
                                                                        athlete.name
                                                                    }

                                                                </td>


                                                                {/* =========================
                                                                    SNATCH
                                                                ========================== */}

                                                                <td
                                                                    className={
                                                                        isCurrentAttempt(
                                                                            athlete,
                                                                            "SNATCH",
                                                                            1
                                                                        )
                                                                            ? "current-attempt"
                                                                            : ""
                                                                    }
                                                                >

                                                                    {
                                                                        renderAttempt(
                                                                            athlete.snatchAttempts?.[0],
                                                                            athlete.openingSnatch
                                                                        )
                                                                    }

                                                                </td>


                                                                <td
                                                                    className={
                                                                        isCurrentAttempt(
                                                                            athlete,
                                                                            "SNATCH",
                                                                            2
                                                                        )
                                                                            ? "current-attempt"
                                                                            : ""
                                                                    }
                                                                >

                                                                    {
                                                                        renderAttempt(
                                                                            athlete.snatchAttempts?.[1]
                                                                        )
                                                                    }

                                                                </td>


                                                                <td
                                                                    className={
                                                                        isCurrentAttempt(
                                                                            athlete,
                                                                            "SNATCH",
                                                                            3
                                                                        )
                                                                            ? "current-attempt"
                                                                            : ""
                                                                    }
                                                                >

                                                                    {
                                                                        renderAttempt(
                                                                            athlete.snatchAttempts?.[2]
                                                                        )
                                                                    }

                                                                </td>


                                                                <td className="best-lift">

                                                                    {
                                                                        athlete.bestSnatch >
                                                                        0
                                                                            ? athlete.bestSnatch
                                                                            : "-"
                                                                    }

                                                                </td>


                                                                {/* =========================
                                                                    CLEAN & JERK
                                                                ========================== */}

                                                                <td
                                                                    className={
                                                                        isCurrentAttempt(
                                                                            athlete,
                                                                            "CLEAN_JERK",
                                                                            1
                                                                        )
                                                                            ? "current-attempt"
                                                                            : ""
                                                                    }
                                                                >

                                                                    {
                                                                        renderAttempt(
                                                                            athlete.cleanJerkAttempts?.[0],
                                                                            athlete.openingCleanJerk
                                                                        )
                                                                    }

                                                                </td>


                                                                <td
                                                                    className={
                                                                        isCurrentAttempt(
                                                                            athlete,
                                                                            "CLEAN_JERK",
                                                                            2
                                                                        )
                                                                            ? "current-attempt"
                                                                            : ""
                                                                    }
                                                                >

                                                                    {
                                                                        renderAttempt(
                                                                            athlete.cleanJerkAttempts?.[1]
                                                                        )
                                                                    }

                                                                </td>


                                                                <td
                                                                    className={
                                                                        isCurrentAttempt(
                                                                            athlete,
                                                                            "CLEAN_JERK",
                                                                            3
                                                                        )
                                                                            ? "current-attempt"
                                                                            : ""
                                                                    }
                                                                >

                                                                    {
                                                                        renderAttempt(
                                                                            athlete.cleanJerkAttempts?.[2]
                                                                        )
                                                                    }

                                                                </td>


                                                                <td className="best-lift">

                                                                    {
                                                                        athlete.bestCleanJerk >
                                                                        0
                                                                            ? athlete.bestCleanJerk
                                                                            : "-"
                                                                    }

                                                                </td>


                                                                {/* TOTAL */}

                                                                <td className="total-cell">

                                                                    {
                                                                        athlete.total >
                                                                        0
                                                                            ? athlete.total
                                                                            : "-"
                                                                    }

                                                                </td>


                                                                {/* RANK */}

                                                                <td className="rank-cell">

                                                                    {
                                                                        athlete.place ||
                                                                        "-"
                                                                    }

                                                                </td>

                                                            </tr>

                                                        );

                                                    }
                                                )
                                            }

                                        </React.Fragment>

                                    )
                                )
                            }


                            {/* =================================
                                NO ATHLETE DATA
                            ================================= */}

                            {
                                sortedCategories.length === 0 && (

                                    <tr>

                                        <td
                                            colSpan="12"
                                        >

                                            No athlete data
                                            available.

                                        </td>

                                    </tr>

                                )

                            }

                        </tbody>

                    </table>

                </main>

            </div>

        </div>

    );

};


export default LiveScoreBoard;