import { Navigate, Outlet } from 'react-router-dom';
import { GOOGLE_AUTH_ENABLED } from '../config/features';
import { useAuth } from '../context/auth';
import { isProfileComplete } from '../services/authService';

export default function ProtectedRoute() {
  const { user, passwordChangeRequired } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  // Con la contraseña vieja el back responde 403 a todo: primero hay que cambiarla
  if (passwordChangeRequired) return <Navigate to="/cambiar-contrasena" replace />;
  // Los usuarios de Google entran sin país: primero tienen que completar el perfil
  if (GOOGLE_AUTH_ENABLED && !isProfileComplete(user)) {
    return <Navigate to="/completar-perfil" replace />;
  }
  return <Outlet />;
}
