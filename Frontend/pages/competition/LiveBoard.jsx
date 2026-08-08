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
    //
    // IMPORTANT:
    //
    // undefined = first render
    // null      = no athlete selected
    // value     = selected athlete ID
    //
    // This prevents scrolling on the
    // initial page load.
    // =====================================

    const previousCurrentAthleteIdRef =
        useRef(undefined);


    // =====================================
    // LIVE COMPETITION STATE
    // =====================================

    const [liveCompetition, setLiveCompetition] =
        useState(null);


    // =====================================
    // LOAD SCOREBOARD
    //
    // READ ONLY
    //
    // This page only GETs competition
    // state. It never changes competition
    // state.
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
    // LIVE POLLING
    //
    // Refresh scoreboard every second.
    //
    // This does NOT control the competition.
    // It only reads the latest server state.
    // =====================================

   useEffect(() => {
    loadScoreBoard();

    const interval = setInterval(() => {
        loadScoreBoard();
    }, 2000);

    return () => {
        clearInterval(interval);
    };
}, [competitionId, gender]);


    // =====================================
    // AUTO-SCROLL
    //
    // IMPORTANT:
    //
    // Scroll ONLY when the OFFICIAL selects
    // a DIFFERENT athlete.
    //
    // DO NOT scroll when:
    //
    // - page initially loads
    // - declaration changes
    // - GOOD LIFT is recorded
    // - NO LIFT is recorded
    // - same athlete gets next attempt
    // - scoreboard polls
    // =====================================

    useEffect(() => {

        const currentAthleteId =
            liveCompetition
                ?.currentAthlete
                ?.entryId
                ?.toString() ??
            null;


        // =================================
        // FIRST DATA LOAD
        //
        // Remember the current athlete,
        // but DO NOT scroll.
        // =================================

        if (
            previousCurrentAthleteIdRef.current ===
            undefined
        ) {

            previousCurrentAthleteIdRef.current =
                currentAthleteId;

            return;

        }


        // =================================
        // ATHLETE HAS CHANGED
        //
        // Example:
        //
        // Athlete A
        //      ↓
        // Athlete B
        //
        // This is the official selecting
        // another athlete.
        // =================================

        if (
            currentAthleteId &&
            currentAthleteId !==
                previousCurrentAthleteIdRef.current
        ) {

            // ---------------------------------
            // Wait until the current row has
            // been rendered.
            // ---------------------------------

            requestAnimationFrame(() => {

                currentRowRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });

            });

        }


        // =================================
        // REMEMBER CURRENT ATHLETE
        // =================================

        previousCurrentAthleteIdRef.current =
            currentAthleteId;


    }, [
        liveCompetition
            ?.currentAthlete
            ?.entryId,
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
        // Use opening weight if declaration
        // has not been stored yet.
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
    // =====================================

    const isCurrentAttempt = (
        athlete,
        phase,
        attemptNo
    ) => {

        return (

            athlete.entryId ===
                liveCompetition
                    .currentAthlete
                    ?.entryId &&

            athlete.currentAttempt
                ?.phase ===
                phase &&

            athlete.currentAttempt
                ?.attemptNo ===
                attemptNo

        );

    };


    // =====================================
    // GROUP RESULTS BY WEIGHT CATEGORY
    // =====================================

    const groupedResults =
        liveCompetition
            .competitionResults
            .reduce(
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
                        a.replace(
                            "+",
                            ""
                        )
                    );


                const weightB =
                    Number(
                        b.replace(
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
                            liveCompetition
                                .currentAthlete
                                ?.currentAttempt
                                ?.phase ??
                            "-"
                        }

                    </span>


                    <span>
                        |
                    </span>


                    <span>

                        ATT.{" "}

                        {
                            liveCompetition
                                .currentAthlete
                                ?.currentAttempt
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

                            <col className="col-event" />

                            <col className="col-bw" />


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

                                <th rowSpan="2">
                                    Event
                                </th>

                                <th rowSpan="2">
                                    BW
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
                                                    colSpan="14"
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

                                                        const isCurrent =
                                                            athlete.entryId ===
                                                            liveCompetition
                                                                .currentAthlete
                                                                ?.entryId;


                                                        const isNext =
                                                            athlete.entryId ===
                                                            liveCompetition
                                                                .nextAthlete
                                                                ?.entryId;


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
                                                                        athlete
                                                                            .lotNumber
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


                                                                {/* EVENT */}

                                                                <td>

                                                                    {
                                                                        athlete.event
                                                                    }

                                                                </td>


                                                                {/* BODY WEIGHT */}

                                                                <td>

                                                                    {
                                                                        athlete.bodyWeight
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
                                                                            athlete
                                                                                .snatchAttempts[0],
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
                                                                            athlete
                                                                                .snatchAttempts[1]
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
                                                                            athlete
                                                                                .snatchAttempts[2]
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
                                                                            athlete
                                                                                .cleanJerkAttempts[0],
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
                                                                            athlete
                                                                                .cleanJerkAttempts[1]
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
                                                                            athlete
                                                                                .cleanJerkAttempts[2]
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

                        </tbody>

                    </table>

                </main>

            </div>

        </div>

    );

};


export default LiveScoreBoard;