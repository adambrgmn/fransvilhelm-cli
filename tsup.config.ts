import { defineConfig } from 'tsup';

export default defineConfig((what) => ({
  entry: ['src/cli.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'node16',
  format: ['cjs', 'esm'],
  esbuildOptions: (options) => {
    options.jsx = 'automatic';
    if (what.watch) options.jsxDev = true;
  },
}));
