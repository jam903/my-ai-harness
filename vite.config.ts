// Vite + Vitest config (ADR-0001).
// `base` must match the GitHub Pages subpath: https://jam903.github.io/my-ai-harness/
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/my-ai-harness/',
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
