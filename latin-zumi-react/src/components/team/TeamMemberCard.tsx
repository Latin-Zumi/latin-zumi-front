import type { TeamMember } from '../../data/team';

interface TeamMemberCardProps {
  member: TeamMember;
}

export default function TeamMemberCard({ member }: TeamMemberCardProps) {
  const { name, initials, role, email } = member;

  return (
    <article className="panel team-card">
      <span className="team-card__avatar" aria-hidden="true">
        {initials}
      </span>
      <h3 className="team-card__name">{name}</h3>
      <p className="team-card__role">{role}</p>
      {email && (
        <a className="team-card__email" href={`mailto:${email}`}>
          {email}
        </a>
      )}
    </article>
  );
}