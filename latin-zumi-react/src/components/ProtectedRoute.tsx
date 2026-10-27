import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingState } from './states';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingState message="Verificando sesión..." />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}