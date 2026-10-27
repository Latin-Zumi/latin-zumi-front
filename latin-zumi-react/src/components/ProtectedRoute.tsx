import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isProfileComplete } from '../services/authService';

export default function ProtectedRoute() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  // Los usuarios de Google entran sin país: primero tienen que completar el perfil
  if (!isProfileComplete(user)) return <Navigate to="/completar-perfil" replace />;
  return <Outlet />;
}
