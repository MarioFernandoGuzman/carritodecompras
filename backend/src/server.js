import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

const server = app.listen(env.PORT, () => {
  process.stdout.write(`API disponible en http://127.0.0.1:${env.PORT}\n`);
});

function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exitCode = 0;
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
