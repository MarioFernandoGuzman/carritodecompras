import { pool } from '../config/db.js';

export async function guardarAdmin({ nombre, email, passwordHash }) {
  await pool.execute(
    `INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
     VALUES (?, ?, ?, 'admin', 1)
     ON DUPLICATE KEY UPDATE nombre = ?, password_hash = ?, rol = 'admin', activo = 1`,
    [nombre, email, passwordHash, nombre, passwordHash],
  );
}
