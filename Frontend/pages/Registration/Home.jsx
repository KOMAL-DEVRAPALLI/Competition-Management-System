import Navbar from "../../components/Athlete/Navbar/Navbar.jsx";
import HeroSection from "../../components/Athlete/Hero/HeroSection.jsx";
import AboutCompetition from "../../components/Athlete/About/AboutCompetition.jsx";
import CompetitionInfo from "../../components/Athlete/Competition/CompetitionInfo.jsx";
import EligibilitySection from "../../components/Athlete/Eligibility/EligibilitySection.jsx";
import RegistrationProcess from "../../components/Athlete/RegistrationProcess/RegistrationProcess.jsx";
import RequiredDocuments from "../../components/Athlete/RequiredDocuments/RequiredDocuments.jsx";
import ContactSection from "../../components/Athlete/Contact/ContactSection.jsx";
import Footer from "../../components/Athlete/Footer/Footer.jsx";
const Home = () => {
  return (
    <>
      <Navbar />
      <HeroSection />
      <AboutCompetition />
      <CompetitionInfo />
      <EligibilitySection />
      <RegistrationProcess />
      <RequiredDocuments />
      <ContactSection />
      <Footer />
    </>
  );
};

export default Home;