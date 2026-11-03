import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminError from '../../components/admin/AdminError';
import { LoadingState } from '../../components/states';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/auth';
import { getUser, setUserStatus } from '../../services/adminService';
import type { AdminUserDetail as UserDetail, UserStatus } from '../../types/admin';
import { USER_STATUS_LABELS } from '../../utils/admin';
import { CURRENCY_NAMES, formatMoney } from '../../utils/money';
import {
  formatTransactionDate,
  getTransactionDescription,
  TRANSACTION_TYPE_LABELS,
} from '../../utils/transactions';

export default function AdminUserDetail() {
  const { id = '' } = useParams();
  const { user: admin } = useAuth();
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [actionError, setActionError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    getUser(id)
      .then((data) => {
        if (ignore) return;
        setDetail(data);
        setError('');
      })
      .catch((caught: unknown) => {
        if (!ignore) setError(caught instanceof Error ? caught.message : 'No pudimos cargar el usuario.');
      });
    return () => {
      ignore = true;
    };
  }, [id, attempt]);

  const current = detail?.user.id === id ? detail : null;
  const isBlocked = current?.user.estado === 'bloqueado';
  const nextStatus: UserStatus = isBlocked ? 'activo' : 'bloqueado';
  const isSelf = current?.user.id === admin?.id;

  async function changeStatus() {
    if (!current || isSaving) return;
    setActionError('');
    setIsSaving(true);
    try {
      const user = await setUserStatus(current.user.id, nextStatus);
      setDetail({ ...current, user });
      setConfirming(false);
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : 'No pudimos cambiar el estado.');
    } finally {
      setIsSaving(false);
    }
  }

  function closeConfirm() {
    if (isSaving) return;
    setConfirming(false);
    setActionError('');
  }

  return (
    <section className="admin-page" aria-labelledby="admin-user-title">
      <Link to="/admin/usuarios" className="admin-page__back">← Volver a usuarios</Link>

      {error ? (
        <AdminError message={error} onRetry={() => setAttempt((value) => value + 1)} />
      ) : !current ? (
        <LoadingState message="Cargando el usuario..." />
      ) : (
        <>
          <header className="admin-page__header">
            <div>
              <p className="dashboard__eyebrow">Usuario</p>
              <h1 id="admin-user-title">{current.user.nombre || current.user.email}</h1>
              <p className="admin-page__intro">
                {current.user.email} · {current.user.pais ?? 'Sin país'} · Alta{' '}
                {formatTransactionDate(current.user.created_at)}
              </p>
            </div>
            <div className="admin-page__actions">
              <span className={`admin-status admin-status--${current.user.estado}`}>
                {USER_STATUS_LABELS[current.user.estado] ?? current.user.estado}
              </span>
              {!isSelf && (
                <Button variant="solid" outline={!isBlocked} onClick={() => setConfirming(true)}>
                  {isBlocked ? 'Activar cuenta' : 'Bloquear cuenta'}
                </Button>
              )}
            </div>
          </header>

          <div className="admin-card">
            <h2>Saldos</h2>
            <ul className="admin-balances">
              {current.balances.map((balance) => (
                <li key={balance.account_id}>
                  <span>{CURRENCY_NAMES[balance.currency]}</span>
                  <strong>{formatMoney(balance.amount, balance.currency)}</strong>
                </li>
              ))}
            </ul>
          </div>

          <div className="admin-card">
            <h2>Últimos movimientos</h2>
            {current.recent_transactions.length === 0 ? (
              <p className="admin-card__note">Todavía no tiene movimientos.</p>
            ) : (
              <ul className="admin-history">
                {current.recent_transactions.map((transaction) => (
                  <li key={transaction.id} className="admin-history__item">
                    <span className="admin-history__field">{getTransactionDescription(transaction)}</span>
                    <strong>{formatMoney(transaction.amount, transaction.currency)}</strong>
                    <span className="admin-history__meta">
                      {TRANSACTION_TYPE_LABELS[transaction.type]} · {formatTransactionDate(transaction.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Modal
            isOpen={confirming}
            onClose={closeConfirm}
            title={isBlocked ? 'Activar la cuenta' : 'Bloquear la cuenta'}
            footer={
              <>
                <Button variant="solid" outline onClick={closeConfirm} disabled={isSaving}>
                  Cancelar
                </Button>
                <Button variant="solid" onClick={() => void changeStatus()} loading={isSaving}>
                  {isBlocked ? 'Activar' : 'Bloquear'}
                </Button>
              </>
            }
          >
            <p>
              {isBlocked
                ? `${current.user.nombre} va a poder volver a ingresar y operar.`
                : `${current.user.nombre} no va a poder ingresar ni operar hasta que se active de nuevo. Sus saldos y movimientos no cambian.`}
            </p>
            {actionError && <p className="form-error" role="alert">{actionError}</p>}
          </Modal>
        </>
      )}
    </section>
  );
}
