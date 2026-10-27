import TeamMemberCard from '../components/team/TeamMemberCard';
import { TEAM, type TeamArea } from '../data/team';

const listFormat = new Intl.ListFormat('es', {
  style: 'long',
  type: 'conjunction',
});

function namesByArea(area: TeamArea): string {
  return listFormat.format(
    TEAM.filter((member) => member.area === area).map((member) => member.name),
  );
}

export default function About() {
  return (
    <main className="about">
      <section className="home-hero">
        <div className="home-hero__text">
          <p className="home-hero__eyebrow">Nosotros</p>
          <h1>El equipo detrás de Latin Zumi</h1>
          <p className="home-hero__lead">
            Somos cuatro desarrolladores full stack que escribimos código
            limpio, ordenado y pensado para crecer, para que cualquiera pueda
            leerlo y trabajar sobre él.
          </p>
        </div>
      </section>

      <section className="about__section" aria-labelledby="team-title">
        <h2 id="team-title">Conocé al equipo</h2>
        <div className="team-grid">
          {TEAM.map((member) => (
            <TeamMemberCard key={member.name} member={member} />
          ))}
        </div>
      </section>

      <section className="panel about__work" aria-labelledby="work-title">
        <h2 id="work-title">Cómo trabajamos</h2>
        <p>
          <strong>{namesByArea('frontend')}</strong> desarrollaron el frontend:
          la interfaz, la navegación y la experiencia de uso de la billetera.
        </p>
        <p>
          <strong>{namesByArea('backend')}</strong> desarrollaron el backend y
          la base de datos: la API, la autenticación y el manejo de balances y
          transacciones.
        </p>
      </section>
    </main>
  );
}