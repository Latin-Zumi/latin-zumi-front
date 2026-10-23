import { useNavigate } from 'react-router-dom';
import RegisterForm from '../components/forms/RegisterForm';

export default function Register() {
  const navigate = useNavigate();

  return (
    <main>
      <h1>Crear cuenta en Latin Zumi</h1>
      <RegisterForm onSuccess={() => navigate('/dashboard')} />
    </main>
  );
}
