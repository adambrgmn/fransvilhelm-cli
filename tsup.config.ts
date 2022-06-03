import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/cli.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'node16',
  format: ['cjs', 'esm'],
});
