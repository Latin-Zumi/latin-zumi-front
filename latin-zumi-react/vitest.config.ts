import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// Reusa la configuración de Vite (plugins de React y Tailwind) y le suma la de los tests
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Todos los tests viven en tests/, con la misma estructura que src/
      include: ['tests/**/*.test.{ts,tsx}'],
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      // Los tests no necesitan los estilos; así corren más rápido
      css: false,
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/**/*.d.ts', 'src/types/**'],
        reporter: ['text', 'html'],
      },
    },
  }),
)
