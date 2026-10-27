# React + TypeScript + Vite

## Configuración de la API

Copiá `.env.example` a `.env.local` y configurá `VITE_API_URL` con la URL base
del backend. El frontend la usa para las solicitudes de autenticación y billetera.
Si no se define, se usa `http://localhost:3000`.

El frontend envía `email` y `password` a `POST /auth/login`; el registro envía
`nombre`, `email`, `pais` y `password` a `POST /auth/register`. Ambos esperan
una respuesta con `token` y `user` con el formato definido en
`src/services/authService.ts`. El login interpreta `401` como credenciales
incorrectas y el registro `409` como email ya existente.

Estas solicitudes requieren el backend; no hay autenticación simulada.
`VITE_USE_MOCK` solo activa los balances de ejemplo y no afecta login ni
registro. La sesión se conserva en `localStorage`; cerrar sesión solo la borra
del frontend, ya que todavía no existe una solicitud de revocación al backend.

## Preparación de Firebase Authentication

La configuración de la aplicación web de Firebase se define mediante las
variables `VITE_FIREBASE_*` de `.env.local`; sus nombres están listados en
`.env.example`. `src/services/firebase.ts` ofrece inicializadores reutilizables
y diferidos para Firebase App y Firebase Auth, y valida la configuración al
usarlos.

Esta preparación no cambia todavía el inicio de sesión ni el registro: ambos
siguen usando `/auth/login` y `/auth/register`. Para completar la integración,
el backend debe verificar los Firebase ID tokens y definir cómo asociará el
perfil de Latin Zumi (incluidos país y roles) y cómo autorizará los endpoints de
la billetera. La interfaz actual tampoco incluye un botón de inicio de sesión
con Google.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
