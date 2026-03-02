import { defineConfig } from 'vite';

export default defineConfig({
  base: '/teams-timer/',
  build: {
    target: ['chrome90', 'edge90', 'firefox90', 'safari15'],
    outDir: 'dist',
  },
});
