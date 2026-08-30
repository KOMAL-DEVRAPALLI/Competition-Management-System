import { Routes, Route } from "react-router-dom";

import RegistrationForm from "../pages/Registration/RegistrationForm";
import RegistrationSuccess from "../pages/Registration/RegistrationSucess";
import Home from "../pages/Registration/Home";
import CreateCompetition from "../pages/competition/CreateCompetition.jsx";
import CompetitionManagement from "../pages/competition/CompetitionMangament.jsx";
import StartList from "../pages/competition/StartList";
import CompetitionEntry from "../pages/competition/CompetitionEntry";
import ScoreSheet from "../pages/competition/ScoreSheet";
import AddAthlete from "../pages/competition/AddAthlete";
import SessionDashboard from "../pages/SessionDashboard";
import CompetitionAthleteList from "../pages/competition/CompetitionAthlete.jsx";
import Dashboard from "../pages/competition/AdminDashboard/Dashboard";
import LiveScore from "../pages/competition/LiveScore";
import LiveScoreBoard from "../pages/competition/LiveBoard";

import AdminLogin from "../pages/Admin/AdminLogin";
import ProtectedRoute from "./ProtectedRoute.jsx";

const App = () => {

    return (

        <Routes>

            {/* ============================= */}
            {/* PUBLIC */}
            {/* ============================= */}

            <Route
                path="/"
                element={<Home />}
            />

            <Route
                path="/register"
                element={<RegistrationForm />}
            />

            <Route
                path="/registration-success"
                element={<RegistrationSuccess />}
            />


            {/* ============================= */}
            {/* ADMIN LOGIN */}
            {/* ============================= */}

            <Route
                path="/admin/login"
                element={<AdminLogin />}
            />


            {/* ============================= */}
            {/* PROTECTED ADMIN AREA */}
            {/* ============================= */}

            <Route element={<ProtectedRoute />}>

                <Route
                    path="/admin"
                    element={<Dashboard />}
                />
                <Route
                    path="/admin/competition/create"
                    element={<CreateCompetition />}
                />
<Route
    path="/admin/competition/:competitionId"
    element={<CompetitionManagement />}
/>
                <Route
                    path="/admin/competition/:competitionId/athletes/:gender"
                    element={<CompetitionAthleteList />}
                />
                <Route
                    path="/admin/competition/:competitionId/athletes/:gender/add"
                    element={<AddAthlete />}
                />
                <Route
                    path="/admin/competition/:competitionId/start-list/:gender"
                    element={<StartList />}
                />

                <Route
                    path="/admin/competition-entry/:competitionId/:athleteId"
                    element={<CompetitionEntry />}
                />

                <Route
                    path="/admin/competition-entry/:entryId/score-sheet"
                    element={<ScoreSheet />}
                />

                <Route
                    path="/admin/live-score/:competitionId/:gender"
                    element={<LiveScore />}
                />

            </Route>


            {/* ============================= */}
            {/* PUBLIC SCOREBOARD */}
            {/* ============================= */}

            <Route
                path="/admin/score-board/:competitionId/:gender"
                element={<LiveScoreBoard />}
            />

            <Route
                path="/competition/:competitionId/session/:gender"
                element={<SessionDashboard />}
            />

        </Routes>

    );
};

export default App;