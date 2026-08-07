import "./RequiredDocuments.css";
import {
  FaIdCard,
  FaCamera,
  FaFileAlt,
  FaMoneyBillWave,
  FaCheckCircle,
} from "react-icons/fa";

const RequiredDocuments = () => {
  return (
    <section id="requirements" className="requirements">

      <div className="section-heading">
        <span>BEFORE YOU REGISTER</span>

        <h2>Documents & Registration Fee</h2>

        <p>
          Keep the required documents ready and review the registration fee
          before submitting your application.
        </p>
      </div>

      <div className="requirements__container">

        {/* Documents */}

        <div className="requirements__card">
          <h3>Required Documents</h3>

          <ul>

            <li>
              <FaCamera className="icon" />
              Passport Size Photograph
            </li>

            <li>
              <FaIdCard className="icon" />
              Aadhaar Card
            </li>

            <li>
              <FaFileAlt className="icon" />
              Birth Certificate
            </li>

            <li>
              <FaCheckCircle className="icon" />
              IWLF Card (Optional)
            </li>

          </ul>
        </div>

        {/* Fee */}

        <div className="requirements__card fee-card">

          <h3>Registration Fee</h3>

          <div className="fee">

            ₹100

          </div>

          <p>
            Registration fee is charged
            <strong> per selected age category.</strong>
          </p>

          <div className="fee-note">
            Example:
            <br />
            Youth = ₹100
            <br />
            Youth + Junior = ₹200
          </div>

        </div>

      </div>

    </section>
  );
};

export default RequiredDocuments;