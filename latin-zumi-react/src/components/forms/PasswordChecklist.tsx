import {
  getPasswordLengthMessage,
  getPasswordRequirements,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../../utils/registration';

// Requisitos de una contraseña nueva: registro, restablecer y cambiar contraseña
export default function PasswordChecklist({ id, value }: { id: string; value: string }) {
  const requirements = getPasswordRequirements(value);
  const checklist = [
    {
      label: `Entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres`,
      met: requirements.hasMinimumLength,
      hint: getPasswordLengthMessage(value.length),
    },
    { label: 'Incluir una mayúscula', met: requirements.hasUppercase },
    { label: 'Incluir un carácter especial', met: requirements.hasSpecialCharacter },
  ];
  const metRequirements = checklist.filter((item) => item.met).length;

  return (
    <div id={id} className="mb-4">
      <ul className="flex list-none flex-col gap-1 text-sm text-muted">
        {checklist.map((item) => (
          <li key={item.label} className={item.met ? 'text-success' : undefined}>
            <span aria-hidden="true">{item.met ? '✓' : '○'}</span>
            {' '}{item.label}
            {item.hint && ` (${item.hint})`}
            <span className="sr-only">{item.met ? ', cumplido' : ', pendiente'}</span>
          </li>
        ))}
      </ul>
      {/* Solo cambia cuando cambia la cantidad cumplida, así no se anuncia en cada tecla */}
      <p className="sr-only" aria-live="polite">
        {metRequirements} de {checklist.length} requisitos cumplidos
      </p>
    </div>
  );
}
