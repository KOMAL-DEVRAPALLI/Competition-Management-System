import "./CompetitionInfo.css";
import {
  FaLocationDot,
  FaCalendarCheck,
  FaCalendarXmark,
  FaTrophy,
} from "react-icons/fa6";

const CompetitionInfo = () => {
  return (
    <section className="competition-info">

      <div className="section-heading">
        <span>IMPORTANT DETAILS</span>

        <h2>Competition Information</h2>

        <p>
          Check the important dates and venue before
          completing your registration.
        </p>
      </div>

      <div className="competition-grid">

        <div className="info-card">
          <FaLocationDot className="info-icon" />

          <h3>Venue</h3>

          <p>Surat Weightlifting Club, Beside, State Bank of India, Bhatha, Hazira Road, Surat</p>
        </div>


        <div className="info-card">
          <FaCalendarXmark className="info-icon" />

          <h3>Registration Ends</h3>

          <p>31st July 2026</p>
        </div>

        <div className="info-card">
          <FaTrophy className="info-icon" />

          <h3>Competition Dates</h3>

          <p>01-02 August 2026</p>
        </div>

      </div>

    </section>
  );
};

export default CompetitionInfo;