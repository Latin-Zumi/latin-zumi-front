# Spec: Configurar Vitest y coverage

## Fecha
2026-10-29

## Problema
El front no tiene tests automáticos. Cada cambio se prueba a mano, así que un error en algo delicado (montos en centavos, validación de la contraseña, manejo de la sesión) puede pasar sin que nadie lo note.

## Solución propuesta
Configurar Vitest con coverage para que el equipo empiece a escribir tests, todos en una carpeta aparte.

- **Herramientas:**
  - **Vitest:** corre los tests y usa la misma configuración de Vite que la app.
  - **@vitest/coverage-v8:** muestra qué partes del código cubren los tests.
  - **Testing Library** (`react`, `dom`, `jest-dom`, `user-event`) y **jsdom:** para probar componentes como los usaría una persona: buscar por rol o texto, hacer clic y escribir.
- **Carpeta `tests/`:** repite la estructura de `src/`, así se encuentra rápido el test de cada archivo (`src/utils/money.ts` → `tests/utils/money.test.ts`).
- **`tests/setup.ts`:** suma los matchers de jest-dom (`toBeDisabled`, `toHaveClass`…). Después de cada test desmonta lo renderizado y limpia `localStorage`, para que la sesión o los datos mock de un test no afecten al siguiente.
- **Tipos:** `tsconfig.test.json` incluye `src` y `tests`, y está referenciado en `tsconfig.json`, así que `npm run build` también revisa los tipos de los tests.
- **Coverage:** mide `src/` (sin `main.tsx` ni los tipos) y muestra el resultado en la terminal y en `coverage/index.html`. Por ahora no exige un mínimo. Se puede agregar cuando haya una base de tests, para que no baje.
- **Scripts:**
  - `npm test`: corre todos los tests una vez.
  - `npm run test:watch`: los vuelve a correr al guardar.
  - `npm run coverage`: corre los tests y genera el reporte.
- **Primeros tests,** para comprobar que la configuración anda:
  - `tests/utils/money.test.ts`: montos, centavos y saldo disponible.
  - `tests/components/ui/Button.test.tsx`: clic, carga y estilo con borde.

## Archivos afectados
- `package.json` y `package-lock.json`: dependencias y scripts.
- `vitest.config.ts` (nuevo)
- `tsconfig.test.json` (nuevo), `tsconfig.json` y `tsconfig.node.json`
- `eslint.config.js`: ignora `coverage/`.
- `tests/setup.ts` (nuevo)
- `tests/utils/money.test.ts` (nuevo)
- `tests/components/ui/Button.test.tsx` (nuevo)

## Pasos
1. Instalar las dependencias.
2. Configurar Vitest, los tipos y el setup.
3. Agregar los scripts y los primeros tests.

## Cómo probar
- [x] `npm test`: 2 archivos y 8 tests pasan.
- [x] `npm run coverage` muestra la tabla y genera `coverage/`, que está en `.gitignore`.
- [x] `npm run build` y `npx eslint .` pasan.

## Riesgos / notas
- **Cómo seguir:** los tests de lo que ya existe van por área, en una rama cada una (`utils`, `services`, componentes). Lo nuevo lleva su test en la misma rama que el código.
- **Coverage bajo al principio (1,5 %):** es esperable con dos archivos de test; sirve para ver qué falta.
- **CI:** todavía no corre en GitHub. Se puede sumar después un workflow que ejecute `npm test` en cada PR.
