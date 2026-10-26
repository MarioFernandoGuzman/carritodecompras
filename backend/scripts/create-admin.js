import { pool } from '../src/config/db.js';
import { adminSchema } from '../src/schemas/admin.schema.js';
import { crearOActualizarAdmin } from '../src/services/admin.service.js';

try {
  const result = adminSchema.safeParse(process.env);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path[0]))];
    throw new Error(`Revisa ${fields.join(', ')} en .env. Usa un email válido, nombre de 1–100 caracteres y contraseña de al menos 12 caracteres y máximo 72 bytes.`);
  }
  await crearOActualizarAdmin(result.data);
  process.stdout.write('Administrador creado o actualizado correctamente.\n');
} catch (error) {
  console.error(error.code ? `No se pudo guardar el administrador (${error.code}). Revisa MySQL y ejecuta db:setup primero.` : error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
