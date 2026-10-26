import { Link } from "react-router-dom";
import Navbar from "./Navbar";

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link
          to="/"
          className="site-brand"
          aria-label="Latin Zumi, inicio"
        >
          <img
            src="/LatinZumiLogo.png"
            alt=""
            className="site-brand__logo"
          />
        </Link>

        <Navbar />
      </div>
    </header>
  );
}

export default Header;
