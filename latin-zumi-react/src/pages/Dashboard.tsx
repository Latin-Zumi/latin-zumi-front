import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Hola, {user?.nombre}</p>
    </main>
  );
}