import "./ContactSection.css";
import {
  FaPhone,
  FaEnvelope,
  FaLocationDot,
} from "react-icons/fa6";

const ContactSection = () => {
  return (
    <section id="contact" className="contact">

      <div className="section-heading">
        <span>CONTACT</span>

        <h2>Need Assistance?</h2>

        <p>
          For any queries regarding registration or the championship,
          please contact the organizing committee.
        </p>
      </div>

      <div className="contact__grid">

        <div className="contact__card">
          <FaPhone className="contact__icon" />
          <h3>Phone</h3>
          <p>+91 XXXXX XXXXX</p>
        </div>

        <div className="contact__card">
          <FaEnvelope className="contact__icon" />
          <h3>Email</h3>
          <p>sdwa@example.com</p>
        </div>

        <div className="contact__card">
          <FaLocationDot className="contact__icon" />
          <h3>Location</h3>
          <p>Surat, Gujarat, India</p>
        </div>

      </div>

    </section>
  );
};

export default ContactSection;