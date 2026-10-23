import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/forms/LoginForm';

export default function Login() {
  const navigate = useNavigate();

  return (
    <main>
      <h1>Ingresar a Latin Zumi</h1>
      <LoginForm onSuccess={() => navigate('/dashboard')} />
    </main>
  );
}