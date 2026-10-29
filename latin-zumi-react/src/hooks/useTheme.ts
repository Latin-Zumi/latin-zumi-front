import { useState } from 'react';

export type Theme = 'light' | 'dark';

// La misma clave la lee el script de index.html para aplicar el tema antes de pintar
const STORAGE_KEY = 'latin-zumi:theme';

function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage no disponible: el tema dura hasta recargar
    }
    setTheme(next);
  }

  return { theme, toggleTheme };
}
