export type TeamArea = 'frontend' | 'backend';

export interface TeamMember {
  name: string;
  initials: string;
  area: TeamArea;
  role: string;
  email?: string;
}

export const TEAM: TeamMember[] = [
  {
    name: 'Diego Cáceres',
    initials: 'DC',
    area: 'frontend',
    role: 'Frontend',
  },
  {
    name: 'Hessam Mahamud',
    initials: 'HM',
    area: 'backend',
    role: 'Backend y base de datos',
  },
  {
    name: 'Valentina Fresia',
    initials: 'VF',
    area: 'frontend',
    role: 'Frontend',
  },
  {
    name: 'Joaquín Orozco',
    initials: 'JO',
    area: 'backend',
    role: 'Backend y base de datos',
  },
];