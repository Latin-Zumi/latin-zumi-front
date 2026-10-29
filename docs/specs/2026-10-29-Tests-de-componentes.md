# Spec: Tests de componentes

## Fecha
2026-10-29

## Problema
Los componentes base (campos, modal, estados de carga y error) se usan en toda la app, y el login y el depósito son los flujos que más toca el usuario. Solo `Button` tenía tests, así que un cambio podía romper la accesibilidad de un campo, el cierre del modal o el reintento de un depósito sin que nadie lo notara.

## Solución propuesta
Testear los componentes con Testing Library como los usa una persona: buscando por etiqueta, rol y texto, y haciendo clic o escribiendo con `user-event`.

- **`Input`:**
  - la etiqueta queda asociada al campo;
  - el error lo marca como inválido y se lee como descripción, sumado a la que ya traía (por ejemplo, el saldo disponible).
- **`Modal`:**
  - se nombra con el título, toma el foco y bloquea el scroll;
  - se cierra con Escape, con la X, con el botón y tocando el fondo, pero no tocando adentro;
  - se puede desactivar el cierre con Escape y con el fondo;
  - al cerrarse devuelve el foco al botón que lo abrió.
- **`AvailableBalance`:** saldo de la moneda elegida; "Usar todo" completa el monto con coma decimal y no aparece sin saldo.
- **`ThemeToggle`:** arranca con el tema que aplicó `index.html`, lo cambia, lo guarda y actualiza la etiqueta.
- **Estados (`LoadingState`, `EmptyState`, `ErrorState`):** se anuncian a lectores de pantalla y muestran su acción solo si la tienen.
- **`ProtectedRoute`:** sin sesión manda al login; con sesión muestra la página.
- **`LoginForm`:**
  - vacío no llama al backend, marca los errores y lleva el foco al primero;
  - el error del email aparece recién al salir del campo;
  - saca los espacios del email antes de iniciar sesión;
  - muestra el error del backend o uno genérico, y lo borra al volver a escribir.
- **`DepositModal`:**
  - no avanza con un monto inválido;
  - pide confirmar y manda el monto en el formato del backend (`1250,5` → `1250.50`);
  - "Volver" conserva lo cargado;
  - si falla, reintenta con la misma `Idempotency-Key`, para que el backend no acredite dos veces.

En `LoginForm` se reemplaza solo `login` del servicio y en `DepositModal` solo el contexto de la billetera, así el test no depende del backend ni del mock.

## Archivos afectados
- `tests/components/ui/Input.test.tsx` (nuevo)
- `tests/components/ui/Modal.test.tsx` (nuevo)
- `tests/components/wallet/AvailableBalance.test.tsx` (nuevo)
- `tests/components/wallet/DepositModal.test.tsx` (nuevo)
- `tests/components/common/ThemeToggle.test.tsx` (nuevo)
- `tests/components/states/States.test.tsx` (nuevo)
- `tests/components/ProtectedRoute.test.tsx` (nuevo)
- `tests/components/forms/LoginForm.test.tsx` (nuevo)

## Pasos
1. Componentes base: `Input`, `Modal`, estados.
2. Componentes de la billetera y del tema.
3. Flujos: ruta protegida, login y depósito.

## Cómo probar
- [x] `npm test`: 17 archivos y 95 tests pasan.
- [x] `npm run coverage`: `components/ui` y `components/states` quedan en 90 % y 100 %; `LoginForm` y `DepositModal` en 98 % y 95 % de líneas.
- [x] `npm run build` y `npx eslint .` pasan.

## Riesgos / notas
- **Sin test:** `ExchangeModal`, `RegisterForm`, `CompleteProfileForm`, `Navbar`, los gráficos y el `WalletProvider` quedan para otra rama, junto con las páginas.
- **Campo de monto:** no acepta separador de miles (`1.250,5` da error). Si en algún momento se acepta, hay que sumar ese caso al test de `DepositModal`.
