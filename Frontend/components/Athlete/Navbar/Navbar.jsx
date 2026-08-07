import { Link } from "react-router-dom";
import "./Navbar.css";
import logo from "../../../src/assets/logo.png";

const Navbar = () => {
  return (
    <header className="navbar">

    <div className="navbar__left">

        <img
            src={logo}
            alt="Logo"
            className="navbar__logo"
        />

        <div className="navbar__brand">
             <h1 className="navbar__title">
        Surat District Weightlifting Association
    </h1>
        </div>

    </div>

    <nav className="navbar__center">

        <a href="#home">Home</a>

        <a href="#competition">Competition</a>

        <a href="#requirements">Requirements</a>

        <a href="#contact">Contact</a>

    </nav>

    <div className="navbar__right">

        <Link
            to="/register"
            className="register-btn"
        >
            Register Now
        </Link>

    </div>

</header>
  );
};

export default Navbar;