import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  const rates = [
    { symbol: "USD", value: 1 },
    { symbol: "EUR", value: 0.94 },
    { symbol: "ARS", value: 980 },
    { symbol: "COP", value: 4200 },
  ];

  return (
    <main className="home">
      <h1>{user ? `¡Hola, ${user.nombre}!` : "Latin Zumi"}</h1>
      <p>Tu billetera digital multi-moneda</p>

      <section className="rates">
        <h2>Precios actuales</h2>
        <ul className="rate-list">
          {rates.map((rate) => (
            <li key={rate.symbol}>
              <strong>{rate.symbol}</strong>: {rate.value}
            </li>
          ))}
        </ul>
      </section>

      <div className="actions">
        {isAuthenticated ? (
          <>
            <Link className="btn btn-md" to="/dashboard">Depositar</Link>
            <Link className="btn btn-md" to="/dashboard">Transferir</Link>
            <Link className="btn btn-md" to="/dashboard">Cambiar moneda</Link>
          </>
        ) : (
          <>
            <p>Para operar, iniciá sesión o creá tu cuenta.</p>
            <Link to="/login" className="btn btn-md">Ingresar</Link>
            <Link to="/register" className="btn btn-md">Crear cuenta</Link>
          </>
        )}
      </div>
    </main>
  );
}
