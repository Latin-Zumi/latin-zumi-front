# Spec: Tests de services

## Fecha
2026-10-29

## Problema
Los servicios hablan con el backend: inician sesión, guardan el token, traen los saldos y hacen transferencias, depósitos y cambios. Si se rompe un header, una URL o el mensaje de un error, el usuario ve "algo salió mal" sin saber por qué, y no había tests que lo detectaran.

## Solución propuesta
Testear `authService`, `walletService` y `transactionService` reemplazando `fetch` por uno simulado. Así se revisa qué se le manda al backend y qué ve el usuario con cada respuesta, sin depender de que la API esté levantada.

- **`authService`:**
  - login manda el email en `identifier` y guarda la sesión;
  - mensaje para cada status (400, 401, 429, 500 y uno desconocido) y sin conexión;
  - una respuesta con forma inválida no se guarda como sesión;
  - registro, incluido el email que ya tiene cuenta (409);
  - `getSession` descarta sesiones mal guardadas;
  - logout revoca el token y borra la sesión aunque falle la red;
  - en modo mock, login con un usuario de prueba sin llamar al backend.
- **`walletService`:**
  - sin sesión pide iniciarla;
  - `GET /accounts` con el token y la conversión de cada cuenta a saldo (también saldo "0");
  - 401 es sesión vencida; 403 pide cambiar la contraseña, pero no cierra la sesión;
  - error del servidor y sin conexión.
- **`transactionService`:**
  - la transferencia manda token, `Idempotency-Key`, `Content-Type` y los datos;
  - URL de filtros sin los vacíos y URL de la cotización;
  - código de error que manda el backend, 401 sin body, código desconocido y sin conexión;
  - en modo mock, repetir un depósito con la misma `Idempotency-Key` no lo acredita dos veces, y no se puede transferir a uno mismo.
- **`tests/helpers/api.ts`:** helpers para simular `fetch`, guardar una sesión de prueba y leer qué se mandó en cada llamada.

Los servicios leen `VITE_USE_MOCK` y `VITE_API_URL` al cargarse. Para que el `.env` de cada uno no cambie los resultados, cada test fija esas variables y vuelve a importar el servicio. Los mocks esperan 400 ms para simular la API; los tests usan timers falsos para no esperar de verdad.

## Archivos afectados
- `vitest.config.ts` (deshace `stubEnv` y `stubGlobal` después de cada test)
- `tests/setup.ts` (borra `localStorage` y vuelve a los timers reales después de cada test)
- `tests/helpers/api.ts` (nuevo)
- `tests/services/authService.test.ts` (nuevo)
- `tests/services/walletService.test.ts` (nuevo)
- `tests/services/transactionService.test.ts` (nuevo)

## Pasos
1. Limpieza automática entre tests y helpers para la API.
2. Un archivo de test por servicio.

## Cómo probar
- [x] `npm test`: 9 archivos y 65 tests pasan.
- [x] `npm run coverage`: `transactionService` 83 %, `walletService` 75 %, `authService` 63 % de líneas.
- [x] `npm run build` y `npx eslint .` pasan.

## Riesgos / notas
- **Sin test:** `ratesService` y `userService` quedan para otra rama. De `authService` falta el resto del modo mock (registro y cambio de contraseña).
- **Modo mock:** se testea lo que cambia el comportamiento (idempotencia, transferirse a uno mismo); los datos de prueba en sí no.
- **Siguiente rama:** tests de componentes con Testing Library.
