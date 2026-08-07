import { Routes, Route } from "react-router-dom";
import RegistrationForm from "../pages/Registration/RegistrationForm";
import RegistrationSuccess from "../pages/Registration/RegistrationSucess";
import Home from "../pages/Registration/Home";
import CompetitionAthleteList from "../pages/competition/CompetitionAthlete";
import StartList from "../pages/competition/StartList";
import CompetitionEntry from "../pages/competition/CompetitionEntry";
import ScoreSheet from "../pages/competition/ScoreSheet";
import SessionDashboard from "../pages/SessionDashboard";
import Dashboard from "../pages/competition/AdminDashboard/Dashboard";
import LiveScore from "../pages/competition/LiveScore";
import LiveScoreBoard from "../pages/competition/LiveBoard";
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<RegistrationForm />} />
      <Route
        path="/registration-success"
        element={<RegistrationSuccess />}
      />
      <Route
        path="/admin/"
        element={<Dashboard />}
      />
      <Route
        path="/admin/competition/:competitionId/athletes/:gender"
        element={<CompetitionAthleteList />}
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
    path="/competition/:competitionId/session/:gender"
    element={<SessionDashboard />}
/>  
    <Route
    path="/admin/live-score/:competitionId/:gender"
    element={<LiveScore />}
/>

<Route
    path="/admin/score-board/:competitionId/:gender"
    element={<LiveScoreBoard />}
/>
    </Routes>
  );
};

export default App;