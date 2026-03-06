import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// packages/web/vite.config.ts
// Wrapper package: points to monorepo root where index.html and src/ live.
// Story 1.4 will move src/ into packages/web/ and clean up these overrides.
const monorepoRoot = path.resolve(__dirname, '../..');

export default defineConfig({
  root: monorepoRoot,
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: path.resolve(monorepoRoot, 'tailwind.config.ts') }),
        autoprefixer(),
      ],
    },
  },
  server: {
    host: '::',
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(monorepoRoot, 'src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
});
