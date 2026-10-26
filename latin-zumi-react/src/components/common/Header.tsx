import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../ui/Button";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `site-nav__link${isActive ? " is-active" : ""}`;

export function Header() {
  const { user, logout } = useAuth();
  const isAdmin = user?.roles.includes("admin") ?? false;

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

        <nav className="site-nav" aria-label="Navegación principal">
          <NavLink to="/" end className={navLinkClass}>Inicio</NavLink>
          {user && <NavLink to="/dashboard" className={navLinkClass}>Mi billetera</NavLink>}
          {isAdmin && <NavLink to="/admin" className={navLinkClass}>Panel admin</NavLink>}
        </nav>

        <div className="site-actions">
          {user ? (
            <div className="account-actions">
              <span className="account-identity__name">
                {user.nombre || user.email}
              </span>
              <Button variant="solid" size="sm" onClick={logout}>
                Salir
              </Button>
            </div>
          ) : (
            <div className="account-actions">
              <Link to="/login">Ingresar</Link>
              <Link to="/register" className="btn btn-sm">Crear cuenta</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;