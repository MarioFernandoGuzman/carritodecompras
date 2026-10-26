import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const args = process.argv.slice(2);
const testMode = args.includes('--test');
const database = testMode ? 'gorras_test' : 'gorras_db';
let connection;

try {
  if (args.some((arg) => arg !== '--test')) {
    throw new Error('Uso: npm run db:setup [-- --test].');
  }
  if (!testMode && (env.NODE_ENV === 'test' || env.DB_NAME !== 'gorras_db')) {
    throw new Error('Para gorras_test usa npm run db:setup:test; para desarrollo configura DB_NAME=gorras_db.');
  }

  const schema = await readFile(new URL('../../database/schema.sql', import.meta.url), 'utf8');
  const seed = testMode ? null : await readFile(new URL('../../database/seed.sql', import.meta.url), 'utf8');
  connection = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    charset: 'utf8mb4',
    connectTimeout: 5000,
    // Solo esta conexión de instalación ejecuta archivos SQL locales con varias sentencias.
    multipleStatements: true,
  });

  process.stdout.write(`Recreando tablas de ${database}; se eliminarán sus datos anteriores.\n`);
  // El destino se elige entre dos literales, nunca desde un identificador proporcionado por el usuario.
  await connection.query(testMode ? schema.replace('USE gorras_db;', 'USE gorras_test;') : schema);
  if (seed) await connection.query(seed);
  process.stdout.write(`${database} preparada ${testMode ? 'sin datos semilla' : 'con datos semilla'}.\n`);
} catch (error) {
  if (connection) await connection.rollback().catch(() => {});
  const message = error.code ? `No se pudo preparar ${database} (${error.code}). Revisa MySQL y .env.` : error.message;
  console.error(message);
  process.exitCode = 1;
} finally {
  if (connection) await connection.end();
}
