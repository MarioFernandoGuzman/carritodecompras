import { app } from './app.js';
import { env } from './config/env.js';
import { sequelize } from './config/db.js';

if (!env.JWT_SECRET) throw new Error('Configura JWT_SECRET con al menos 32 caracteres en backend/.env.');

const server = app.listen(env.PORT, () => {
  process.stdout.write(`API disponible en http://127.0.0.1:${env.PORT}\n`);
});

function shutdown() {
  server.close(async () => {
    await sequelize.close();
    process.exitCode = 0;
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
