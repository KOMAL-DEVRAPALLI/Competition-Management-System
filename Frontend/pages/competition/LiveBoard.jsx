import React, {
    useEffect,
    useState,
    useRef,
} from "react";
import { useParams } from "react-router-dom";
import { apiRequest } from "../../api/axios";
import "./LiveScoreBoard.css";

const LiveScoreBoard = () => {

    const { competitionId, gender } = useParams();
const currentRowRef = useRef(null);
        const [liveCompetition, setLiveCompetition] = useState(null);

    const loadScoreBoard = async () => {

        try {

            const response = await apiRequest(
                `/live-competition/${competitionId}/${gender}`,
                "GET"
            );

            setLiveCompetition(response.data);

        } catch (error) {

            console.log(error);

        }

    };

    useEffect(() => {

        loadScoreBoard();

        /* const interval = setInterval(
            loadScoreBoard,
            3000
        ); */


    }, []);
    useEffect(() => {

    currentRowRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
    });

}, [liveCompetition?.currentAthlete?.entryId]);
    if (!liveCompetition) {
        return <h2>Loading...</h2>;
    }
    const renderAttempt = (attempt, openingWeight) => {

        if (!attempt) {
            return "-";
        }

        let weight = attempt.declaredWeight;

        if (
            attempt.attemptNo === 1 &&
            (weight === 0 || weight == null)
        ) {
            weight = openingWeight;
        }

        if (!weight) {
            return "-";
        }

        switch (attempt.result) {

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
    const isCurrentAttempt = (
        athlete,
        phase,
        attemptNo
    ) => {

        return (
            athlete.entryId ===
            liveCompetition.currentAthlete?.entryId &&
            athlete.currentAttempt?.phase === phase &&
            athlete.currentAttempt?.attemptNo === attemptNo
        );

    };
   const groupedResults = liveCompetition.competitionResults.reduce(
    (groups, athlete) => {

        const weight = athlete.weightCategory;

        if (!groups[weight]) {
            groups[weight] = [];
        }

        groups[weight].push(athlete);

        return groups;

    },
    {}
);

const sortedCategories = Object.entries(groupedResults).sort(
    ([a], [b]) => {

        const weightA = Number(a.replace("+", ""));
        const weightB = Number(b.replace("+", ""));

        if (weightA !== weightB) {
            return weightA - weightB;
        }

        if (a.startsWith("+") && !b.startsWith("+")) {
            return 1;
        }

        if (!a.startsWith("+") && b.startsWith("+")) {
            return -1;
        }

        return 0;

    }
);

    return (

        <div className="scoreboard">

            <header className="header">

                <h1 className="competition-title">
                    SDWA DISTRICT WEIGHTLIFTING CHAMPIONSHIP
                </h1>

                <div className="header-info">

                    <span>
                        {gender === "female"
                            ? "WOMEN"
                            : "MEN"}
                    </span>

                    <span>|</span>

                    <span>
                        {
                            liveCompetition.currentAthlete
                                ?.currentAttempt?.phase ??
                            "-"
                        }
                    </span>

                    <span>|</span>

                    <span>
                        ATT.
                        {" "}
                        {
                            liveCompetition.currentAthlete
                                ?.currentAttempt?.attemptNo ??
                            "-"
                        }
                    </span>

                </div>

            </header>

            <div className="content">

            

                <main className="table-area">

                  <table className="score-table">

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

    <thead>

        <tr>

            <th rowSpan="2">Lot</th>

            <th rowSpan="2">Athlete</th>

            <th rowSpan="2">Event</th>

            <th rowSpan="2">BW</th>

            <th colSpan="4">SNATCH</th>

            <th colSpan="4">CLEAN &amp; JERK</th>

            <th rowSpan="2">Total</th>

            <th rowSpan="2">Rank</th>

        </tr>

        <tr>

            <th>1</th>
            <th>2</th>
            <th>3</th>
            <th>B</th>

            <th>1</th>
            <th>2</th>
            <th>3</th>
            <th>B</th>

        </tr>

    </thead>

    <tbody>

        {Object.entries(groupedByWeight).map(
            ([weightCategory, athletes]) => (
                <Fragment key={weightCategory}>

                    <tr className="category-row">

                        <td colSpan={14}>

                            <div className="category-header">

                                <div className="category-left">
                                    <strong>
                                        Weight Category : {weightCategory} kg
                                    </strong>
                                </div>

                                <div className="category-right">

                                    <strong>
                                        {athletes.length} Athlete
                                        {athletes.length > 1 ? "s" : ""}
                                    </strong>

                                </div>

                            </div>

                        </td>

                    </tr>

                    {athletes.map((athlete) => (
                        <tr
                            key={athlete.entryId}
                            className={
                                athlete.status === "ON_PLATFORM"
                                    ? "current-athlete-row"
                                    : athlete.status === "NEXT"
                                    ? "next-athlete-row"
                                    : ""
                            }
                        >

                            <td>{athlete.lotNumber}</td>

                            <td className="athlete-name">
                                {athlete.name}
                            </td>

                            <td>
                                {athlete.currentAttempt.phase === "SNATCH"
                                    ? "S"
                                    : "C&J"}
                            </td>

                            <td>{athlete.bodyWeight}</td>

                            {renderAttempts(
                                athlete.snatchAttempts,
                                athlete.results?.bestSnatch
                            )}

                            {renderAttempts(
                                athlete.cleanJerkAttempts,
                                athlete.results?.bestCleanJerk
                            )}

                            <td className="total-cell">
                                {athlete.results?.total || ""}
                            </td>

                            <td className="rank-cell">
                                {athlete.results?.rank || ""}
                            </td>

                        </tr>
                    ))}

                </Fragment>
            )
        )}

    </tbody>

</table>

                </main>

            </div>

        </div>

    );
};

export default LiveScoreBoard;