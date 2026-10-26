import { sequelize } from "../src/config/db.js";
try {
  await sequelize.authenticate();
  process.stdout.write("Conexión con MySQL mediante Sequelize correcta.\n");
} catch {
  console.error("No se pudo conectar. Revisa MySQL y backend/.env.");
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
