import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  sourcemap: true,
  clean: true,
  // Пакеты монорепо поставляются исходниками на TS — вшиваем их в бандл.
  noExternal: [/^@childgpt\//],
});
