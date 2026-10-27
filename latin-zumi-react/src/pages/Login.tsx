import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LoadingState } from '../components/states';
import LoginForm from '../components/forms/LoginForm';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, startSession } = useAuth();

  if (isLoading) {
    return (
      <main className="auth-page">
        <LoadingState message="Verificando sesión..." />
      </main>
    );
  }
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <header className="auth-card__header">
          <span className="auth-card__eyebrow">LATIN ZUMI · BIENVENIDO</span>
          <h1 id="login-title">Ingresá a tu cuenta</h1>
          <p>Entrá para ver tus balances y movimientos.</p>
        </header>

        <LoginForm
          onSuccess={(session) => {
            startSession(session);
            navigate('/dashboard');
          }}
        />

        <p className="auth-card__footer">
          ¿No tenés cuenta? <Link to="/register">Crear cuenta</Link>
        </p>
      </section>
    </main>
  );
}
