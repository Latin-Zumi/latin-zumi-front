import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth';

// Solo comodidad: quien protege los datos es el backend, que responde 403 a quien no es admin
export default function AdminRoute() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!user.roles.includes('admin')) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
