import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <p>
        © {new Date().getFullYear()} Surat District Weightlifting Association
      </p>

      <p>
        Website developed by{" "}
        <a
          href="https://www.linkedin.com/in/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <strong>Komal Devrapalli</strong>
        </a>
      </p>
    </footer>
  );
}

export default Footer;