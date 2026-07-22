import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Rutas relativas: el build funciona en GitHub Pages / Cloudflare Pages sin conocer el subpath.
  base: './',
  test: {
    environment: 'happy-dom',
  },
});
