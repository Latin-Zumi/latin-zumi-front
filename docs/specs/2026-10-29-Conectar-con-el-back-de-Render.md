# Spec: Conectar con el back de Render

## Fecha
2026-10-29

## Problema
El back ya está desplegado en Render (`https://latin-zumi-back.onrender.com`), con la base de datos en Neon. El front seguía apuntando a `http://localhost:3000`, así que solo funcionaba con el back corriendo en la compu de cada uno o en modo mock.

## Solución propuesta
Apuntar el front a la API de Render. El front no se conecta a Neon: habla con la API y la API con la base de datos. La cadena de conexión de Neon nunca va en el front, porque todo lo que empieza con `VITE_` queda visible en el navegador.

- **`.env.example`:** `VITE_API_URL` pasa a la URL de Render (sin `/api-docs`), con una nota sobre el back local y sobre CORS.
- **`.env` de cada uno** (no se sube a Git):
  ```
  VITE_API_URL=https://latin-zumi-back.onrender.com
  VITE_USE_MOCK=false
  ```
- **Vercel:** cargar las mismas dos variables en Settings → Environment Variables y volver a desplegar. Vite las mete en el build, así que cambiarlas no afecta lo que ya está publicado.

### Endpoints
| Función del front | Endpoint del back | Estado |
|---|---|---|
| Login, registro, logout | `/auth/login`, `/auth/register`, `/auth/logout` | Coinciden |
| Saldos | `GET /accounts` | Coincide |
| Movimientos, buscar destinatario, transferir | `/wallet/transactions`, `/users/lookup`, `/wallet/transfers` | Existen, pero la documentación no muestra qué devuelven. Siguen apagados (`TRANSACTIONS_ENABLED`) hasta probarlos |
| Depositar | No hay `/wallet/deposits` | `POST /accounts/{id}` registra un ingreso convertido a la moneda principal; no es lo mismo |
| Cambiar moneda | No hay cotización ni cambio | Falta en el back |

## Archivos afectados
- `.env.example`

## Pasos
1. Apuntar el `.env` y el `.env.example` a Render.
2. Que back permita CORS para el front (ver notas).
3. Cargar las variables en Vercel y volver a desplegar.
4. Probar login, saldos y logout con un usuario de prueba.

## Cómo probar
- [x] `GET /health/ready` responde `{"status":"ok","db":"ok"}`: la API está activa y conectada a Neon.
- [x] Desde el front en Vercel (`https://latin-zumi-front-1x4s.vercel.app`) el navegador llega al back sin errores de CORS. El build publicado ya usa la URL de Render.
- [ ] Desde `http://localhost:5173`, la app llega al back. **Hoy falla:** el back no permite ese origen (ver notas).
- [ ] Login, saldos y logout con un usuario de prueba.

## Riesgos / notas
- **CORS en local (lo resuelve back):** en Render, `CORS_ORIGINS` solo tiene el dominio de Vercel, así que desde `http://localhost:5173` el navegador bloquea todo. Para poder desarrollar contra el back de Render tiene que quedar así, separado por coma y sin barra final:
  ```
  CORS_ORIGINS=https://latin-zumi-front-1x4s.vercel.app,http://localhost:5173
  ```
- **Puerto local:** en local hay que correr Vite en el puerto 5173, que es el que el back permite.
- **Contraseña del registro:** el front mantiene de 8 a 24 caracteres, por decisión del equipo de front. El back exige de 15 a 128, así que hasta que back baje su mínimo a 8, las contraseñas de 8 a 14 caracteres fallan al registrarse. Ya está anotado en la spec del 28/10.
- **Render gratis:** el back se duerme si no lo usan un rato y el primer pedido puede tardar entre 30 y 60 segundos.
- **Credenciales de Neon:** circularon en archivos `.env` del back. Conviene que back cambie la contraseña y use una distinta para desarrollo y para producción.
