import { pool } from '../config/db.js';

export async function buscarPorEmail(email) {
  const [[usuario]] = await pool.execute(
    'SELECT id, nombre, email, telefono, rol, activo, password_hash FROM usuarios WHERE email = ?', [email],
  );
  return usuario;
}

export async function buscarPorId(id) {
  const [[usuario]] = await pool.execute(
    'SELECT id, nombre, email, telefono, rol, activo FROM usuarios WHERE id = ?', [id],
  );
  return usuario;
}

export async function crearCliente({ nombre, email, telefono, passwordHash }) {
  const [result] = await pool.execute(
    "INSERT INTO usuarios (nombre, email, telefono, password_hash, rol) VALUES (?, ?, ?, ?, 'cliente')",
    [nombre, email, telefono, passwordHash],
  );
  return result.insertId;
}
