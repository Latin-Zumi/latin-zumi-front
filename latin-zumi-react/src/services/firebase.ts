import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const requiredConfigKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;

export function isFirebaseConfigured(): boolean {
  return requiredConfigKeys.every((key) => import.meta.env[key]?.trim());
}

export class FirebaseConfigurationError extends Error {}

function validateFirebaseConfig() {
  if (isFirebaseConfigured()) return;

  const missingKeys = requiredConfigKeys.filter((key) => !import.meta.env[key]?.trim());

  throw new FirebaseConfigurationError(
    `Falta configurar Firebase en las variables de entorno: ${missingKeys.join(', ')}`,
  );
}

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp;

  const existingApp = getApps().find((app) => app.name === '[DEFAULT]');
  if (existingApp) {
    firebaseApp = existingApp;
    return firebaseApp;
  }

  validateFirebaseConfig();
  firebaseApp = initializeApp(firebaseConfig);
  return firebaseApp;
}

export function getFirebaseAuth(): Auth {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(getFirebaseApp());
  }
  return firebaseAuth;
}
