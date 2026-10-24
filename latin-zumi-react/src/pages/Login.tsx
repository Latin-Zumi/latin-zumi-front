import { Link, Navigate, useNavigate } from 'react-router-dom';
import LoginForm from '../components/forms/LoginForm';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, startSession } = useAuth();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <main>
      <h1>Ingresar a Latin Zumi</h1>
      <LoginForm
        onSuccess={(session) => {
          startSession(session);
          navigate('/dashboard');
        }}
      />
      <p>
        ¿No tenés cuenta? <Link to="/register">Crear cuenta</Link>
      </p>
    </main>
  );
}