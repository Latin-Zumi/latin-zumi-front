import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AdminError from '../../components/admin/AdminError';
import { LoadingState } from '../../components/states';
import Button from '../../components/ui/Button';
import { getUsers } from '../../services/adminService';
import type { AdminUser, AdminUserFilters, Page, UserStatus } from '../../types/admin';
import { USER_STATUS_LABELS } from '../../utils/admin';
import { formatTransactionDate } from '../../utils/transactions';

const PAGE_SIZE = 20;

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<AdminUserFilters>({ page: 1, limit: PAGE_SIZE });
  const [result, setResult] = useState<{ filters: AdminUserFilters; page: Page<AdminUser> } | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false; // descarta la respuesta si cambiaron los filtros mientras cargaba
    getUsers(filters)
      .then((page) => {
        if (ignore) return;
        setResult({ filters, page });
        setError('');
      })
      .catch((caught: unknown) => {
        if (!ignore) setError(caught instanceof Error ? caught.message : 'No pudimos cargar los usuarios.');
      });
    return () => {
      ignore = true;
    };
  }, [filters, attempt]);

  const current = result?.filters === filters ? result.page : null;
  const page = filters.page ?? 1;
  const totalPages = current ? Math.max(1, Math.ceil(current.total / PAGE_SIZE)) : 1;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({ ...filters, search: search.trim() || undefined, page: 1 });
  }

  return (
    <section className="admin-page" aria-labelledby="admin-users-title">
      <header className="admin-page__header">
        <div>
          <p className="dashboard__eyebrow">Panel de administración</p>
          <h1 id="admin-users-title">Usuarios</h1>
        </div>
      </header>

      <form className="admin-filters" role="search" onSubmit={submitSearch}>
        <label>
          Buscar por nombre o email
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
        </label>
        <label>
          Estado
          <select
            value={filters.estado ?? ''}
            onChange={(event) =>
              setFilters({ ...filters, estado: (event.target.value || undefined) as UserStatus | undefined, page: 1 })
            }
          >
            <option value="">Todos</option>
            {Object.entries(USER_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <Button variant="solid" type="submit">Buscar</Button>
      </form>

      {error ? (
        <AdminError message={error} onRetry={() => setAttempt((value) => value + 1)} />
      ) : !current ? (
        <LoadingState message="Cargando los usuarios..." />
      ) : current.items.length === 0 ? (
        <div className="admin-card" role="status">
          <h2>No hay usuarios que coincidan</h2>
          <p className="admin-card__note">Probá con otra búsqueda o con otro estado.</p>
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Email</th>
                  <th scope="col">País</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Alta</th>
                </tr>
              </thead>
              <tbody>
                {current.items.map((user) => (
                  <tr key={user.id}>
                    <th scope="row">
                      <Link to={`/admin/usuarios/${user.id}`}>{user.nombre || user.email}</Link>
                      {user.roles.includes('admin') && <span className="admin-badge">Admin</span>}
                    </th>
                    <td>{user.email}</td>
                    <td>{user.pais ?? '—'}</td>
                    <td>
                      <span className={`admin-status admin-status--${user.estado}`}>
                        {USER_STATUS_LABELS[user.estado] ?? user.estado}
                      </span>
                    </td>
                    <td>{formatTransactionDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav className="admin-pagination" aria-label="Páginas">
            <Button
              variant="solid"
              size="sm"
              outline
              disabled={page <= 1}
              onClick={() => setFilters({ ...filters, page: page - 1 })}
            >
              Anterior
            </Button>
            <span>Página {page} de {totalPages} · {current.total} usuarios</span>
            <Button
              variant="solid"
              size="sm"
              outline
              disabled={page >= totalPages}
              onClick={() => setFilters({ ...filters, page: page + 1 })}
            >
              Siguiente
            </Button>
          </nav>
        </div>
      )}
    </section>
  );
}
