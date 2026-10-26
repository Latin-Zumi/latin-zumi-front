import { Link, Navigate, useNavigate } from 'react-router-dom';
import RegisterForm from '../components/forms/RegisterForm';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, startSession } = useAuth();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <header className="auth-card__header">
          <span className="auth-card__eyebrow">LATIN ZUMI · CUENTA NUEVA</span>
          <h1 id="register-title">Creá tu cuenta</h1>
          <p>Completá tus datos para empezar a usar tu billetera digital.</p>
        </header>

        <RegisterForm
          onSuccess={(session) => {
            startSession(session);
            navigate('/dashboard');
          }}
        />

        <p className="auth-card__footer">
          ¿Ya tenés cuenta? <Link to="/login">Ingresar</Link>
        </p>
      </section>
    </main>
  );
}
