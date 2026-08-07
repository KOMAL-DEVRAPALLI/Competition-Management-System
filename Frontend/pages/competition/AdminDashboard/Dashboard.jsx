import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../../api/axios.js";
import "./Dashboard.css";

const Dashboard = () => {
    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState({
        totalCompetitions: 0,
        activeCompetitions: 0,
        totalAthletes: 0,
        maleAthletes: 0,
        femaleAthletes: 0,
        preparedEntries: 0,
        pendingEntries: 0,
        recentCompetitions: [],
    });

    const [loading, setLoading] = useState(true);

    const fetchDashboard = async () => {
        try {
            const response = await apiRequest("/admin/dashboard");

            setDashboard(response.data);
        } catch (error) {
            console.error(error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="dashboard-loading">
                Loading Dashboard...
            </div>
        );
    }

    return (
        <div className="dashboard-page">

            <div className="dashboard-header">
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>
                        Competition Management System
                    </p>
                </div>

                <button
                    className="create-btn"
                    onClick={() =>
                        navigate("/admin/competition/create")
                    }
                >
                    + Create Competition
                </button>
            </div>

            {/* Statistics */}

            {/* Competition Summary */}

<div className="dashboard-section">

    <h2>Competition Summary</h2>

    <div className="summary-info">

        <div className="summary-item">
            <span>Total Athletes</span>
            <strong>{dashboard.totalAthletes}</strong>
        </div>

        <div className="summary-item">
            <span>Male Athletes</span>
            <strong>{dashboard.maleAthletes}</strong>
        </div>

        <div className="summary-item">
            <span>Female Athletes</span>
            <strong>{dashboard.femaleAthletes}</strong>
        </div>

    </div>

</div>


            {/* Quick Actions */}

<div className="dashboard-section">

    <h2>Quick Actions</h2>

    {dashboard.recentCompetitions.length === 0 ? (

        <p>No competition available.</p>

    ) : (

        <div className="dashboard-actions">

            <button
                onClick={() =>
                    navigate(
                        `/admin/competition/${dashboard.recentCompetitions[0]._id}/athletes/male`
                    )
                }
            >
                Men's Session
            </button>

            <button
                onClick={() =>
                    navigate(
                        `/admin/competition/${dashboard.recentCompetitions[0]._id}/athletes/female`
                    )
                }
            >
                Women's Session
            </button>

            <button
                onClick={() =>
                    navigate(
                        `/admin/competition/${dashboard.recentCompetitions[0]._id}/start-list/male`
                    )
                }
            >
                Men's Start List
            </button>

            <button
                onClick={() =>
                    navigate(
                        `/admin/competition/${dashboard.recentCompetitions[0]._id}/start-list/female`
                    )
                }
            >
                Women's Start List
            </button>

        </div>

    )}

</div>

            {/* Recent Competitions */}

            <div className="dashboard-section">

                <h2>Recent Competitions</h2>

                <table className="dashboard-table">

                    <thead>

                        <tr>

                            <th>Name</th>
                            <th>Venue</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {dashboard.recentCompetitions.length === 0 ? (

                            <tr>

                                <td colSpan="5">
                                    No competitions found.
                                </td>

                            </tr>

                        ) : (

                            dashboard.recentCompetitions.map(
                                (competition) => (

                                    <tr key={competition._id}>

                                        <td>{competition.name}</td>

                                        <td>{competition.venue}</td>

                                        <td>
                                            {new Date(
                                                competition.startDate
                                            ).toLocaleDateString()}
                                        </td>

                                        <td>
                                            {competition.status}
                                        </td>

                                        <td>

                                            <button
                                                onClick={() =>
                                                    navigate(
                                                        `/admin/competition/${competition._id}`
                                                    )
                                                }
                                            >
                                                Manage
                                            </button>

                                        </td>

                                    </tr>

                                )
                            )

                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
};

export default Dashboard;