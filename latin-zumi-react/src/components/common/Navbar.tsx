import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../ui/Button";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `navbar__link${isActive ? " is-active" : ""}`;

export function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const isAdmin = user?.roles.includes("admin") ?? false;

  // Cerrar el menú móvil al cambiar de ruta
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="navbar">
      <button
        type="button"
        className="navbar__toggle"
        aria-expanded={open}
        aria-controls="navbar-menu"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="navbar__toggle-bar" />
        <span className="navbar__toggle-bar" />
        <span className="navbar__toggle-bar" />
      </button>

      <div id="navbar-menu" className={`navbar__menu${open ? " is-open" : ""}`}>
        <nav className="navbar__links" aria-label="Navegación principal">
          <NavLink to="/" end className={navLinkClass}>Inicio</NavLink>
          <NavLink to="/about" className={navLinkClass}>Nosotros</NavLink>
          {user && <NavLink to="/dashboard" className={navLinkClass}>Mi billetera</NavLink>}
          {isAdmin && <NavLink to="/admin" className={navLinkClass}>Panel admin</NavLink>}
        </nav>

        <div className="navbar__actions">
          {user ? (
            <>
              <span className="account-identity__name">
                {user.nombre || user.email}
              </span>
              <Button variant="solid" size="sm" onClick={logout}>
                Salir
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">Ingresar</Link>
              <Link to="/register" className="btn btn-sm">Crear cuenta</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
