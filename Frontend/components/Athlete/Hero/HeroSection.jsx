import { Link } from "react-router-dom";
import "./HeroSection.css";

const HeroSection = () => {
  return (
    <section id="home" className="hero">

      <div className="hero__overlay">

        <div className="hero__content">

          <p className="hero__affiliation">
            Affiliated to Gujarat State Weightlifting Association
          </p>

          <h1 className="hero__title">
            SURAT DISTRICT
            <br />
            WEIGHTLIFTING ASSOCIATION
          </h1>

          <h2 className="hero__competition">
            District Weightlifting Championship 2026–27
          </h2>

          <p className="hero__subtitle">
            Official Online Registration Portal
          </p>

          <div className="hero__info">
            <span>📅 01-02 August 2026</span>
            <span>📍 Surat, Gujarat</span>
          </div>

          <div className="hero__buttons">
            <Link to="/register" className="hero__primary">
              Register Now
            </Link>

            <a href="#competition" className="hero__secondary">
              Competition Details
            </a>
          </div>

        </div>

      </div>

    </section>
  );
};

export default HeroSection;