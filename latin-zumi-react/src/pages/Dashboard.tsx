import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Hola, {user?.nombre}</p>
      <button type="button" onClick={logout}>
        Salir
      </button>
    </main>
  );
}