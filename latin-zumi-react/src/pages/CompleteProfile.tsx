import { Navigate, useNavigate } from 'react-router-dom';
import CompleteProfileForm from '../components/forms/CompleteProfileForm';
import { useAuth } from '../context/auth';
import { isProfileComplete } from '../services/authService';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (isProfileComplete(user)) return <Navigate to="/dashboard" replace />;

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="profile-title">
        <header className="auth-card__header">
          <span className="auth-card__eyebrow">LATIN ZUMI · ÚLTIMO PASO</span>
          <h1 id="profile-title">Completá tu perfil</h1>
          <p>Necesitamos tu país para configurar tu billetera y tu moneda principal.</p>
        </header>

        <CompleteProfileForm
          askNombre={!user.nombre.trim()}
          onSuccess={(updatedUser) => {
            updateUser(updatedUser);
            navigate('/dashboard', { replace: true });
          }}
        />
      </section>
    </main>
  );
}
