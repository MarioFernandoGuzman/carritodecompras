import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: { NODE_ENV: 'test', DB_NAME: 'gorras_test' },
    fileParallelism: false,
    testTimeout: 15000,
  },
});
