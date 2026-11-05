# Spec: Prender el chatbot y el ingreso con Google

## Fecha
2026-11-05

## Problema
El chatbot y el ingreso con Google tienen que funcionar en la presentación, pero sus flags están fijos en el código. Prenderlos depende de configuración que no está en el repo, y si se prenden antes de tenerla, el usuario ve un error.

## Solución propuesta
Prender cada función con una variable de Vercel:

- `VITE_CHATBOT_ENABLED=true`
- `VITE_GOOGLE_AUTH_ENABLED=true`

Sin esas variables todo sigue apagado, así que el código se puede mergear sin cambiar lo que ve el usuario. Se pueden prender por separado, y apagar cambiando la variable y volviendo a desplegar.

## Archivos afectados
- `latin-zumi-react/src/config/features.ts`
- `latin-zumi-react/.env.example`
- `latin-zumi-react/tests/config/features.test.ts` (nuevo)

## Pasos
1. Mergear este cambio.
2. Configurar el back y Firebase (ver abajo).
3. Cargar las variables en Vercel y volver a desplegar.

## Qué configurar

### Chatbot
1. `GEMINI_API_KEY` en Render.
2. `VITE_CHATBOT_ENABLED=true` en Vercel.

El equipo tiene que aprobar que los saldos y movimientos se manden a Gemini, e informarlo en los términos de la app.

### Google
1. `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` en Render. Hoy `POST /auth/google` responde `503 GOOGLE_AUTH_UNAVAILABLE`.
2. Las seis `VITE_FIREBASE_*` en Vercel, del mismo proyecto de Firebase.
3. En Firebase: habilitar Google como proveedor y agregar `latin-zumi-front-1x4s.vercel.app` a los dominios autorizados.
4. `VITE_GOOGLE_AUTH_ENABLED=true` en Vercel.

## Cómo probar
- [x] `npm test`, `npm run lint` y `npm run build` pasan.
- [x] Sin las variables, la burbuja y el botón de Google no aparecen.
- [x] Con las variables y una API local de prueba, la burbuja envía y muestra la respuesta, y aparece el botón de Google.
- [ ] En producción: el chat responde con los saldos de la cuenta.
- [ ] En producción: ingresar con Google con una cuenta nueva, completar el perfil y llegar a la billetera.
- [ ] En producción: ingresar con Google con un email ya registrado.

## Riesgos / notas
- Vercel lee las variables `VITE_` al construir: después de cambiarlas hay que volver a desplegar.
- `FIREBASE_PRIVATE_KEY` es secreta y va solo en Render. Las `VITE_FIREBASE_*` son públicas.
- Con Google prendido, cualquier cuenta sin país pasa primero por "completar perfil", no solo las de Google. Probar el ingreso del admin después de prenderlo.
