import { useParams, useNavigate } from "react-router-dom";

const SessionDashboard = () => {
    const { competitionId, gender } = useParams();
    const navigate = useNavigate();

    return (
        <div className="session-dashboard">

            <h1>
                {gender === "Female"
                    ? "Women's Session"
                    : "Men's Session"}
            </h1>

           <div className="session-grid">

    <button
        onClick={() =>
            navigate(`/admin/competition/${competitionId}/athletes/${gender}`)
        }
    >
        Athlete List
    </button>

    <button
        onClick={() =>
            navigate(`/competition/${competitionId}/weigh-in/${gender}`)
        }
    >
        Weigh-In
    </button>

    <button
        onClick={() =>
            navigate(`/competition/${competitionId}/opening-lifts/${gender}`)
        }
    >
        Opening Lifts
    </button>

    <button
        onClick={() =>
            navigate(`/admin/competition/${competitionId}/start-list/${gender}`)
        }
    >
        Start List
    </button>

    <button
        onClick={() =>
            window.open(
                `${import.meta.env.VITE_API_URL}/working-sheet/${competitionId}/${gender}`,
                "_blank"
            )
        }
    >
        Working Sheet PDF
    </button>

    <button
        onClick={() =>
            navigate(`/admin/live-score/${competitionId}/${gender}`)
        }
    >
        Official Live Screen
    </button>

    <button
        onClick={() =>
            window.open(
                `/admin/score-board/${competitionId}/${gender}`,
                "_blank"
            )
        }
    >
        Live Scoreboard
    </button>

    <button disabled>
        Results
    </button>

</div>
        </div>
    );
};

export default SessionDashboard;