import { Routes, Route } from "react-router-dom";
import RegistrationForm from "../pages/RegistrationForm";
import RegistrationSuccess from "../pages/RegistrationSucess";
import Home from "../pages/Home";
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<RegistrationForm />} />
      <Route
        path="/registration-success"
        element={<RegistrationSuccess />}
      />
    </Routes>
  );
};

export default App;