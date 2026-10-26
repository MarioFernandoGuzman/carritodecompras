import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: { NODE_ENV: 'test', DB_NAME: 'gorras_test', JWT_SECRET: 'solo-pruebas-secret-sin-uso-en-produccion-1234' },
    fileParallelism: false,
    testTimeout: 15000,
  },
});
