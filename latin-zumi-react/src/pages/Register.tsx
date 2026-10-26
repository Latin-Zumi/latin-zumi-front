import { Link, Navigate, useNavigate } from 'react-router-dom';
import RegisterForm from '../components/forms/RegisterForm';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, startSession } = useAuth();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1>Crear cuenta en Latin Zumi</h1>
        <RegisterForm
          onSuccess={(session) => {
            startSession(session);
            navigate('/dashboard');
          }}
        />
        <p>
          ¿Ya tenés cuenta? <Link to="/login">Ingresar</Link>
        </p>
      </div>
    </main>
  );
}
