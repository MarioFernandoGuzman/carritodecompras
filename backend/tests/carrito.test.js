import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { beforeAll, afterAll, afterEach, expect, test } from 'vitest';
import { app } from '../src/app.js';
import { pool } from '../src/config/db.js';
import { env } from '../src/config/env.js';

const sufijo = randomUUID();
const agent = request.agent(app);
let usuarioId, categoriaId, productoId, varianteId;

beforeAll(async () => {
  if (env.DB_NAME !== 'gorras_test') throw new Error('Las pruebas solo pueden usar gorras_test.');
  const email = `carrito-${sufijo}@example.test`;
  const password = `Clave1-${sufijo}`;
  const [user] = await pool.execute('INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)', ['Cliente carrito', email, await bcrypt.hash(password, 12)]);
  usuarioId = user.insertId;
  const [cat] = await pool.execute('INSERT INTO categorias (nombre, slug) VALUES (?, ?)', [`Carrito ${sufijo}`, `carrito-${sufijo}`]);
  categoriaId = cat.insertId;
  const [prod] = await pool.execute('INSERT INTO productos (categoria_id, nombre, slug, precio) VALUES (?, ?, ?, ?)', [categoriaId, 'Gorra prueba', `gorra-${sufijo}`, '149.00']);
  productoId = prod.insertId;
  const [variante] = await pool.execute('INSERT INTO variantes (producto_id, sku, color_nombre, color_hex, talla, stock) VALUES (?, ?, ?, ?, ?, ?)', [productoId, sufijo, 'Negro', '#14110F', 'S/M', 3]);
  varianteId = variante.insertId;
  await agent.post('/api/auth/login').send({ email, password }).expect(200);
});

afterEach(async () => { if (usuarioId) await pool.execute('DELETE FROM carritos WHERE usuario_id = ?', [usuarioId]); });
afterAll(async () => {
  try {
    if (usuarioId) await pool.execute('DELETE FROM usuarios WHERE id = ?', [usuarioId]);
    if (productoId) await pool.execute('DELETE FROM productos WHERE id = ?', [productoId]);
    if (categoriaId) await pool.execute('DELETE FROM categorias WHERE id = ?', [categoriaId]);
  } finally { await pool.end(); }
});

test('agrega y suma una variante, cambia cantidad, calcula importes y elimina el item', async () => {
  await request(app).get('/api/carrito').expect(401);
  const vacio = await agent.get('/api/carrito').expect(200);
  expect(vacio.body.data.items).toEqual([]);
  const [[{ cantidad }]] = await pool.execute('SELECT COUNT(*) AS cantidad FROM carritos WHERE usuario_id = ?', [usuarioId]);
  expect(cantidad).toBe(0);
  const add = await agent.post('/api/carrito/items').send({ varianteId, cantidad: 1 }).expect(201);
  expect(add.body.data).toMatchObject({ subtotal: '149.00', envio: '25.00', total: '174.00', falta_envio_gratis: '151.00' });
  const itemId = add.body.data.items[0].id;
  const otra = await agent.post('/api/carrito/items').send({ varianteId, cantidad: 1 }).expect(201);
  expect(otra.body.data.items).toHaveLength(1);
  expect(otra.body.data.items[0]).toMatchObject({ id: itemId, cantidad: 2, subtotal: '298.00', stock: 3 });
  const cambio = await agent.patch(`/api/carrito/items/${itemId}`).send({ cantidad: 3 }).expect(200);
  expect(cambio.body.data).toMatchObject({ subtotal: '447.00', envio: '0.00', total: '447.00' });
  const eliminado = await agent.delete(`/api/carrito/items/${itemId}`).expect(200);
  expect(eliminado.body.data).toMatchObject({ items: [], total: '0.00', envio: '0.00' });
});

test('rechaza agregar o aumentar sobre el stock; fusionar recorta e ignora variantes inexistentes', async () => {
  const exceso = await agent.post('/api/carrito/items').send({ varianteId, cantidad: 4 }).expect(409);
  expect(exceso.body.error.detalles.stock).toBe(3);
  const add = await agent.post('/api/carrito/items').send({ varianteId, cantidad: 2 }).expect(201);
  const itemId = add.body.data.items[0].id;
  await agent.post('/api/carrito/items').send({ varianteId, cantidad: 2 }).expect(409);
  await agent.patch(`/api/carrito/items/${itemId}`).send({ cantidad: 4 }).expect(409);
  const concurrentes = await Promise.all([1, 2].map(() => agent.post('/api/carrito/items').send({ varianteId, cantidad: 1 })));
  expect(concurrentes.map((r) => r.status).sort()).toEqual([201, 409]);
  const fusion = await agent.post('/api/carrito/fusionar').send({ items: [{ varianteId, cantidad: 2 }, { varianteId: 4294967295, cantidad: 1 }] }).expect(200);
  expect(fusion.body.data.items[0].cantidad).toBe(3);
  expect(fusion.body.data.avisos.length).toBeGreaterThan(0);
  await agent.delete('/api/carrito').expect(200);
  expect((await agent.get('/api/carrito').expect(200)).body.data.items).toEqual([]);
});
