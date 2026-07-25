import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../components/RegistrationSuccess.css";
import {
    FaCheckCircle,
    FaDownload,
    FaHome,
    FaUser,
    FaEnvelope,
    FaPhone,
    FaClipboardList,
} from "react-icons/fa";

const RegistrationSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const registration = location.state;

  // Prevent direct access without registration data
  if (!registration) {
    return (
      <div className="success-page">
        <div className="success-card">
          <h2>Registration Data Not Found</h2>

          <p>
            It looks like you reached this page directly.
            Please complete the registration first.
          </p>

          <button
            className="home-btn"
            onClick={() => navigate("/")}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="success-page">

      {/* Success Header */}
      <div className="success-card">

        <div className="success-icon">
           <FaCheckCircle />
        </div>

        <h1>Registration Successful</h1>

        <p>
          Your registration has been submitted successfully.
        </p>

      </div>

      {/* Registration Details */}
      <div className="details-card">

        <h2>Registration Details</h2>

        <div className="detail-row">
          <span>Registration Number</span>
          <strong>{registration.registrationNo}</strong>
        </div>

        <div className="detail-row">
          <span>Athlete Name</span>
          <strong>{registration.personalInfo.fullName}</strong>
        </div>

        <div className="detail-row">
          <span>Email</span>
          <strong>{registration.personalInfo.email}</strong>
        </div>

        <div className="detail-row">
          <span>Phone</span>
          <strong>{registration.personalInfo.phone}</strong>
        </div>

      </div>

      {/* Participation */}
      <div className="details-card">

        <h2>Participation</h2>

        {registration.participations.map((item) => (
          <div
            key={item.category}
            className="detail-row"
          >
            <span>{item.category}</span>
          </div>
        ))}

        <div className="detail-row">
          <span>Total Registration Fee</span>
          <strong>
            ₹{registration.participations.length * 100}
          </strong>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="action-buttons">

        <button className="download-btn">
    <FaDownload />
    Download Receipt
</button>

<button
    className="home-btn"
    onClick={() => navigate("/")}
>
    <FaHome />
    Back to Home
</button>

      </div>

      {/* Instructions */}
      <div className="details-card">

        <h2>Important Instructions</h2>

        <ul>
          <li>Carry the registration receipt.</li>

          <li>
            Bring original and photocopies of Aadhaar Card.
          </li>

          <li>
            Bring original and photocopies of Birth Certificate.
          </li>

          <li>
            Carry IWLF Card (if available).
          </li>

          <li>
            Report to the venue before the reporting time.
          </li>
        </ul>

      </div>

    </div>
  );
};

export default RegistrationSuccess;