import "./RegistrationProcess.css";
import {
  FaUserPlus,
  FaFileUpload,
  FaMoneyCheckAlt,
  FaCheckCircle,
} from "react-icons/fa";

const RegistrationProcess = () => {
  return (
    <section className="registration-process">

      <div className="section-heading">
        <span>REGISTRATION PROCESS</span>

        <h2>Complete Your Registration in 4 Steps</h2>

        <p>
          Follow these simple steps to register for the championship.
        </p>
      </div>

      <div className="process-grid">

        <div className="process-card">
          <div className="step-number">1</div>
          <FaUserPlus className="process-icon" />
          <h3>Fill Details</h3>
          <p>Enter your personal and competition details.</p>
        </div>

        <div className="process-card">
          <div className="step-number">2</div>
          <FaFileUpload className="process-icon" />
          <h3>Upload Documents</h3>
          <p>Upload the required documents for verification.</p>
        </div>

        <div className="process-card">
          <div className="step-number">3</div>
          <FaMoneyCheckAlt className="process-icon" />
          <h3>Review & Submit</h3>
          <p>Verify your information and submit the registration.</p>
        </div>

        <div className="process-card">
          <div className="step-number">4</div>
          <FaCheckCircle className="process-icon" />
          <h3>Confirmation</h3>
          <p>Receive your registration receipt and confirmation email.</p>
        </div>

      </div>

    </section>
  );
};

export default RegistrationProcess;