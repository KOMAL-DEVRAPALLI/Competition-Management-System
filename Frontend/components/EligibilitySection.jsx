import "./Eligibility.css";
import { FaUserCheck, FaBirthdayCake, FaCheckCircle } from "react-icons/fa";

const EligibilitySection = () => {
  return (
    <section className="eligibility">
      <div className="section-heading">
        <span>ELIGIBILITY</span>

        <h2>Who Can Participate?</h2>

        <p>
          Athletes are automatically shown eligible categories based on their
          Date of Birth during registration.
        </p>
      </div>

      <div className="eligibility__cards">

        <div className="eligibility__card">
          <FaBirthdayCake className="eligibility__icon" />
          <h3>Age Categories</h3>
          <p>Youth • Junior • Senior</p>
        </div>

        <div className="eligibility__card">
          <FaUserCheck className="eligibility__icon" />
          <h3>Automatic Eligibility</h3>
          <p>No need to choose your age category manually.</p>
        </div>

        <div className="eligibility__card">
          <FaCheckCircle className="eligibility__icon" />
          <h3>Multiple Entries</h3>
          <p>Eligible athletes may register for more than one category.</p>
        </div>

      </div>
    </section>
  );
};

export default EligibilitySection;