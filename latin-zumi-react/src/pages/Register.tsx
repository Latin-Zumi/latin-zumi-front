import { Link, Navigate, useNavigate } from 'react-router-dom';
import RegisterForm from '../components/forms/RegisterForm';
import { useAuth } from '../hooks/useAuth';
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated, startSession } = useAuth();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <main className="register-page">
      <section className="register-card" aria-labelledby="register-title">
        <header className="register-card__header">
          <span className="register-card__eyebrow">LATIN ZUMI · CUENTA NUEVA</span>
          <h1 id="register-title">Creá tu cuenta</h1>
          <p>Completá tus datos para empezar a usar tu billetera digital.</p>
        </header>

        <RegisterForm
          onSuccess={(session) => {
            startSession(session);
            navigate('/dashboard');
          }}
        />

        <p className="register-card__login">
          ¿Ya tenés cuenta? <Link to="/login">Ingresar</Link>
        </p>
      </section>
    </main>
  );
}