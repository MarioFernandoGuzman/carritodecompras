import { pool } from '../src/config/db.js';

try {
  await pool.execute('SELECT 1');
  process.stdout.write('Conexión con MySQL correcta.\n');
} catch (error) {
  console.error('No se pudo conectar con MySQL. Revisa el servicio y backend/.env.', error.code);
  process.exitCode = 1;
} finally {
  await pool.end();
}
