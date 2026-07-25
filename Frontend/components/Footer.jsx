import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">

      <div className="footer__container">

        <div className="footer__left">
          <h3>Surat District Weightlifting Association</h3>

          <p>
            Official Online Registration Portal for the
            District Weightlifting Championship.
          </p>
        </div>

        <div className="footer__middle">
          <h4>Quick Links</h4>

          <a href="#home">Home</a>
          <a href="#competition">Competition</a>
          <a href="#contact">Contact</a>
        </div>

        <div className="footer__right">
          <h4>Affiliation</h4>

          <p>
            Affiliated to Gujarat State Weightlifting Association
          </p>
        </div>

      </div>

      <div className="footer__bottom">
        © 2026 Surat District Weightlifting Association. All Rights Reserved.
      </div>

    </footer>
  );
};

export default Footer;