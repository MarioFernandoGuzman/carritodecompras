import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcrypt';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { pool } from '../src/config/db.js';
import { env } from '../src/config/env.js';

const runFile = promisify(execFile);
const backendDir = fileURLToPath(new URL('../', import.meta.url));
const suffix = randomUUID();
const email = `admin-${suffix}@example.test`;
const invalidEmail = `invalid-${suffix}@example.test`;
let categoriaId;
let productoId;

function runAdmin(overrides) {
  return runFile(process.execPath, ['scripts/create-admin.js'], {
    cwd: backendDir,
    env: { ...process.env, NODE_ENV: 'test', DB_NAME: 'gorras_test', ...overrides },
    timeout: 10000,
  });
}

beforeAll(async () => {
  if (env.DB_NAME !== 'gorras_test') throw new Error('Las pruebas solo pueden usar gorras_test.');
  const [[{ base }]] = await pool.execute('SELECT DATABASE() AS base');
  expect(base).toBe('gorras_test');
  const [category] = await pool.execute(
    'INSERT INTO categorias (nombre, slug) VALUES (?, ?)', [`Prueba ${suffix}`, `prueba-${suffix}`],
  );
  categoriaId = category.insertId;
  const [product] = await pool.execute(
    'INSERT INTO productos (categoria_id, nombre, slug, precio) VALUES (?, ?, ?, ?)',
    [categoriaId, 'Gorra de prueba', `gorra-${suffix}`, '149.00'],
  );
  productoId = product.insertId;
});

afterAll(async () => {
  try {
    await pool.execute('DELETE FROM usuarios WHERE email IN (?, ?)', [email, invalidEmail]);
    if (productoId) await pool.execute('DELETE FROM productos WHERE id = ?', [productoId]);
    if (categoriaId) await pool.execute('DELETE FROM categorias WHERE id = ?', [categoriaId]);
  } finally {
    await pool.end();
  }
});

test('MySQL impide stock negativo, variantes duplicadas y referencias inexistentes; aplica cascada', async () => {
  const insert = `INSERT INTO variantes (producto_id, sku, color_nombre, color_hex, talla, stock)
                  VALUES (?, ?, ?, ?, ?, ?)`;
  const sku = `TEST-${suffix}`;
  await expect(pool.execute(insert, [productoId, sku, 'Negro', '#14110F', 'S/M', -1]))
    .rejects.toMatchObject({ code: 'ER_CHECK_CONSTRAINT_VIOLATED' });
  await pool.execute(insert, [productoId, sku, 'Negro', '#14110F', 'S/M', 3]);
  await expect(pool.execute(insert, [productoId, `OTRO-${suffix}`, 'Negro', '#14110F', 'S/M', 3]))
    .rejects.toMatchObject({ code: 'ER_DUP_ENTRY' });
  await expect(pool.execute(insert, [0, `FK-${suffix}`, 'Negro', '#14110F', 'L/XL', 3]))
    .rejects.toMatchObject({ code: 'ER_NO_REFERENCED_ROW_2' });
  await pool.execute('DELETE FROM productos WHERE id = ?', [productoId]);
  const [[{ cantidad }]] = await pool.execute('SELECT COUNT(*) AS cantidad FROM variantes WHERE producto_id = ?', [productoId]);
  expect(cantidad).toBe(0);
});

test('create-admin crea y actualiza el mismo usuario con bcrypt de costo 12 sin revelar contraseñas', async () => {
  const password = randomUUID();
  const nextPassword = randomUUID();
  const first = await runAdmin({ ADMIN_EMAIL: email, ADMIN_PASSWORD: password, ADMIN_NOMBRE: 'Admin de prueba' });
  const [[created]] = await pool.execute('SELECT id, password_hash, rol, activo FROM usuarios WHERE email = ?', [email]);
  expect(created).toMatchObject({ rol: 'admin', activo: 1 });
  expect(bcrypt.getRounds(created.password_hash)).toBe(12);
  expect(await bcrypt.compare(password, created.password_hash)).toBe(true);
  expect(first.stdout + first.stderr).not.toContain(password);
  expect(first.stdout + first.stderr).not.toContain(created.password_hash);

  await pool.execute("UPDATE usuarios SET rol = 'cliente', activo = 0 WHERE id = ?", [created.id]);
  const second = await runAdmin({ ADMIN_EMAIL: email, ADMIN_PASSWORD: nextPassword, ADMIN_NOMBRE: 'Admin actualizado' });
  const [[updated]] = await pool.execute('SELECT id, nombre, password_hash, rol, activo FROM usuarios WHERE email = ?', [email]);
  expect(updated).toMatchObject({ id: created.id, nombre: 'Admin actualizado', rol: 'admin', activo: 1 });
  expect(bcrypt.getRounds(updated.password_hash)).toBe(12);
  expect(await bcrypt.compare(nextPassword, updated.password_hash)).toBe(true);
  expect(await bcrypt.compare(password, updated.password_hash)).toBe(false);
  expect(second.stdout + second.stderr).not.toContain(nextPassword);
});

test('create-admin rechaza una contraseña inválida sin crear el usuario ni mostrar el valor', async () => {
  const password = 'corta';
  try {
    await runAdmin({ ADMIN_EMAIL: invalidEmail, ADMIN_PASSWORD: password, ADMIN_NOMBRE: 'Inválido' });
    throw new Error('El script debía rechazar la configuración.');
  } catch (error) {
    expect(error.code).toBe(1);
    expect(error.stderr).toContain('ADMIN_PASSWORD');
    expect(error.stdout + error.stderr).not.toContain(password);
  }
  const [[{ cantidad }]] = await pool.execute('SELECT COUNT(*) AS cantidad FROM usuarios WHERE email = ?', [invalidEmail]);
  expect(cantidad).toBe(0);
});
