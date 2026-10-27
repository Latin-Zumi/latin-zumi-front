import { useState } from 'react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { EmptyState } from '../components/states';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  const handleLogout = async () => {
    setLogoutError('');
    try {
      await logout();
      setConfirmOpen(false);
    } catch {
      setLogoutError('No pudimos cerrar sesión. Probá de nuevo.');
    }
  };

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Hola, {user?.nombre || user?.email || 'tu cuenta'}</p>
      {logoutError && (
        <p className="form-error" role="alert">
          {logoutError}
        </p>
      )}
      <EmptyState title="Movimientos" variant="no-transactions" />
      <Button variant="solid" onClick={() => setConfirmOpen(true)}>
        Salir
      </Button>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Cerrar sesión"
        footer={
          <>
            <Button variant="solid" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="solid"
              onClick={() => void handleLogout()}
            >
              Salir
            </Button>
          </>
        }
      >
        <p>¿Seguro que querés cerrar sesión?</p>
      </Modal>
    </main>
  );
}