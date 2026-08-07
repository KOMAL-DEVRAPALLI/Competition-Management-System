import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom"; import useCompetitionEntries from "../../hooks/useCompetitionEntries.js";
import AthleteTable from "../../components/Admin/AthleteTable.jsx";
import { apiRequest } from "../../api/axios.js";
import SearchBar from "../../components/Admin/SearchBar.jsx";
import FilterBar from "../../components/Admin/FilterBar.jsx";
import useCompetition from "../../hooks/useCompetition.js";
import StartCompetitionModal from "../../components/Admin/Competition/StartCompetitionModal.jsx";
import "./CompetitionAthlete.css"

const CompetitionAthleteList = () => {
    const { competitionId, gender: sessionGender } = useParams();
    const location = useLocation()
    const { entries, loading } = useCompetitionEntries(competitionId);
    const {
        competition,
        loading: competitionLoading,
    } = useCompetition(
        competitionId
    );
    const navigate = useNavigate();

    const [search, setSearch] = useState("");

    const [category, setCategory] = useState("");
    const [status, setStatus] = useState("");
    const [showStartModal, setShowStartModal] =
        useState(false);

    const [sessionName, setSessionName] =
        useState("");

    const [
        selectedWeightCategories,
        setSelectedWeightCategories,
    ] = useState([]);
    const filteredEntries = entries.filter((entry) => {
        const registrationNo =
            entry.athleteId?.registrationNo?.toLowerCase() || "";

        const fullName =
            entry.athleteId?.personalInfo?.fullName?.toLowerCase() || "";

        const athleteGender =
            entry.athleteId?.personalInfo?.gender
                ?.trim()
                .toLowerCase() || "";

        const searchMatch =
            registrationNo.includes(search.toLowerCase()) ||
            fullName.includes(search.toLowerCase());

        const categoryMatch =
            category === "" ||
            entry.athleteId?.participations?.some(
                (p) => p.category === category
            );

        const genderMatch =
            athleteGender === sessionGender;

        return (
            searchMatch &&
            categoryMatch &&
            genderMatch
        );
    });
    const groupedEntries = Object.values(
        filteredEntries.reduce((acc, entry) => {
            const athleteId = entry.athleteId._id;

            if (!acc[athleteId]) {
                acc[athleteId] = {
                    athleteId: entry.athleteId,
                    competitionEntries: [],
                };
            }

            acc[athleteId].competitionEntries.push(entry);

            return acc;
        }, {})
    );
const availableWeightCategories = [

    ...new Set(

        (competition?.weightCategories ?? [])

            .filter(
                (item) =>
                    item.gender.toLowerCase() ===
                    sessionGender.toLowerCase()
            )

            .flatMap(
                (item) => item.weights
            )

    ),

].sort((a, b) => {

    const aValue =
        a.startsWith("+")
            ? Number.MAX_SAFE_INTEGER
            : parseFloat(a);

    const bValue =
        b.startsWith("+")
            ? Number.MAX_SAFE_INTEGER
            : parseFloat(b);

    return aValue - bValue;

});


    if (loading) {

        return (
            <div className="container mt-5 text-center">
                <h1>
                    {sessionGender === "Female"
                        ? "Women's Session"
                        : "Men's Session"}
                </h1>        </div>
        );

    }
    const prepareCompetition = async () => {

        try {

            const response = await apiRequest(
                `/competition-entry/prepare/${competitionId}`,
                "POST"
            );
            // console.log("Athletes from API:", response.data);
            alert(response.message);

            window.location.reload();

        } catch (error) {

            alert(error.message);

        }

    };
    const handleStartCompetition = async () => {

        try {

            await apiRequest(
                `/live-competition/start/${competitionId}/${sessionGender}`,
                "POST",
                {
                    sessionName,
                    selectedWeightCategories,
                }
            );

            setShowStartModal(false);

            navigate(
                `/admin/live-score/${competitionId}/${sessionGender}`
            );

        } catch (error) {

            console.log(error);

        }

    };
    return (

        <div className="competition-athlete-page">

            <div className="competition-athlete-header">
                <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Search by name or registration number..."
                />
                <div>

                    <h1 className="page-title">
                        {sessionGender === "female"
                            ? "Women's Competition Athletes"
                            : "Men's Competition Athletes"}
                    </h1>

                    <p className="page-subtitle">
                        Competition ID : {competitionId}
                    </p>

                </div>

                <div className="header-actions">

                    <button
                        className="prepare-btn"
                        onClick={prepareCompetition}
                    >
                        Prepare Competition
                    </button>

                    <button
                        className="start-list-btn"
                        onClick={() =>
                            navigate(
                                `/admin/competition/${competitionId}/start-list/${sessionGender}`,
                                {
                                    state: { refresh: true },
                                }
                            )
                        }
                    >
                        View Start List
                    </button>

                    <button
                        className="live-btn"
                        onClick={() =>
                            navigate(
                                `/admin/live-score/${competitionId}/${sessionGender}`
                            )
                        }
                    >
                        Official Screen
                    </button>
                    <button
                        className="pdf-btn"
                        onClick={() =>
                            setShowStartModal(true)
                        }
                    >
                        Start Competition
                    </button>
                    <button
                        className="scoreboard-btn"
                        onClick={() =>
                            window.open(
                                `/admin/score-board/${competitionId}/${sessionGender}`,
                                "_blank"
                            )
                        }
                    >
                        Live Scoreboard
                    </button>

                </div>

            </div>
            <FilterBar
                category={category}
                status={status}
                onCategoryChange={setCategory}
                onStatusChange={setStatus}
                onReset={() => {
                    setCategory("");
                    setStatus("");
                }}
            />
            <div className="competition-athlete-content">

                {filteredEntries.length === 0 ? (

                    <div className="empty-state">

                        No athletes found for this competition.

                    </div>

                ) : (

                    <AthleteTable entries={groupedEntries} />

                )}

            </div>
            <StartCompetitionModal
                open={showStartModal}
                sessionName={sessionName}
                setSessionName={setSessionName}
                availableWeightCategories={
                    availableWeightCategories
                }
                selectedWeightCategories={
                    selectedWeightCategories
                }
                setSelectedWeightCategories={
                    setSelectedWeightCategories
                }
                onClose={() =>
                    setShowStartModal(false)
                }
                onStart={handleStartCompetition}
            />
        </div>

    );
};

export default CompetitionAthleteList;