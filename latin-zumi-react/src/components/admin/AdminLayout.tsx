import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/auth';
import ThemeToggle from '../common/ThemeToggle';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `admin-nav__link${isActive ? ' is-active' : ''}`;

// Layout propio del panel: Layout deja afuera las rutas /admin
export default function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="admin-layout">
      <header className="admin-header">
        <div className="admin-header__inner">
          <Link to="/admin" className="admin-brand">
            Latin Zumi <span className="admin-brand__tag">Admin</span>
          </Link>
          <nav className="admin-nav" aria-label="Secciones del panel">
            <NavLink to="/admin" end className={tabClass}>Resumen</NavLink>
            <NavLink to="/admin/parametros" className={tabClass}>Parámetros</NavLink>
            <NavLink to="/admin/usuarios" className={tabClass}>Usuarios</NavLink>
          </nav>
          <div className="admin-header__actions">
            <span className="admin-header__user">{user?.nombre || user?.email}</span>
            <Link to="/dashboard" className="admin-header__back">Ir a mi billetera</Link>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
