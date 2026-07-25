import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import AboutCompetition from "../components/AboutCompetition";
import CompetitionInfo from "../components/CompetitionInfo";
import EligibilitySection from "../components/EligibilitySection";
import RegistrationProcess from "../components/RegistrationProcess";
import RequiredDocuments from "../components/RequiredDocuments";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";
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