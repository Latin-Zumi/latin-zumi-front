# Spec: Contextos organizados por carpeta

## Fecha
2026-10-27

## Problema
Cada contexto está repartido en dos carpetas: el `createContext` y el provider en `src/context/`, y el hook en `src/hooks/`. Para entender o cambiar auth o la billetera hay que saltar entre carpetas, y con cada contexto nuevo se agranda la mezcla. Además, `hooks/` termina mezclando hooks genéricos (`useFieldValidation`) con hooks atados a un contexto.

## Solución propuesta
Una carpeta por contexto dentro de `src/context/`, con todo lo suyo y un `index.ts` para importar desde un solo lugar:

```
src/context/
├── auth/
│   ├── AuthContext.ts      (createContext y tipos)
│   ├── AuthProvider.tsx
│   ├── useAuth.ts
│   └── index.ts
└── wallet/
    ├── WalletContext.ts
    ├── WalletProvider.tsx
    ├── useWallet.ts
    └── index.ts
```

Los imports pasan a ser `import { useAuth } from '../context/auth'`.

El contexto y el provider siguen en archivos separados porque el lint (`react-refresh/only-export-components`) pide que un archivo con un componente no exporte otras cosas.

`hooks/` queda solo para hooks genéricos.

No cambia la lógica: solo se mueven archivos y se actualizan imports.

## Archivos afectados
- Se mueven con `git mv`, para conservar el historial:
  - `context/auth-context.ts` → `context/auth/AuthContext.ts`
  - `context/AuthProvider.tsx` → `context/auth/AuthProvider.tsx`
  - `hooks/useAuth.ts` → `context/auth/useAuth.ts`
  - `context/wallet-context.ts` → `context/wallet/WalletContext.ts`
  - `context/WalletProvider.tsx` → `context/wallet/WalletProvider.tsx`
  - `hooks/useWallet.ts` → `context/wallet/useWallet.ts`
- Se crean `context/auth/index.ts` y `context/wallet/index.ts`.
- Cambian los imports en:
  - `main.tsx`
  - `components/ProtectedRoute.tsx`
  - `components/common/Navbar.tsx`
  - `components/wallet/DepositModal.tsx`
  - `pages/Home.tsx`, `Login.tsx`, `Register.tsx`, `CompleteProfile.tsx` y `Dashboard.tsx`

## Pasos
1. Crear las carpetas y mover los archivos.
2. Agregar los `index.ts`.
3. Actualizar los imports.

## Cómo probar
- [x] `npm run build` y `npx eslint .` sin errores.
- [x] No queda ningún import a `hooks/useAuth`, `hooks/useWallet`, `auth-context` ni `wallet-context`.
- [x] Login, logout y la Navbar con sesión funcionan igual que antes.
- [x] El Dashboard carga saldos; depósito y transferencia funcionan.

## Riesgos / notas
- **Otras ramas abiertas:** si alguien tiene una rama abierta que importa `hooks/useAuth`, al mergear `dev` le va a fallar el build. Se arregla cambiando el import a `context/auth`.
- **Contextos nuevos:** van con la misma estructura (`context/<nombre>/` con su `index.ts`).
