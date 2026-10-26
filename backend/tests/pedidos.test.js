import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { beforeAll, afterAll, afterEach, expect, test } from 'vitest';
import { app } from '../src/app.js';
import { pool } from '../src/config/db.js';
import { env } from '../src/config/env.js';

const clave = randomUUID();
const agent = request.agent(app);
const otro = request.agent(app);
const datos = { nombre_destinatario: 'Cliente prueba', telefono_contacto: '55551234', direccion_envio: 'Avenida de prueba 123', ciudad: 'Guatemala', metodo_pago: 'tarjeta', pago_marca: 'visa', pago_ultimos4: '4242' };
let usuarioId, otroId, categoriaId, productoId, varianteA, varianteB;

beforeAll(async () => {
  if (env.DB_NAME !== 'gorras_test') throw new Error('Las pruebas solo pueden usar gorras_test.');
  const password = `Clave1-${clave}`;
  const hash = await bcrypt.hash(password, 12);
  const [u] = await pool.execute('INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)', ['Comprador', `pedido-${clave}@example.test`, hash]);
  usuarioId = u.insertId;
  const [o] = await pool.execute('INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)', ['Otro', `otro-${clave}@example.test`, hash]);
  otroId = o.insertId;
  const [cat] = await pool.execute('INSERT INTO categorias (nombre, slug) VALUES (?, ?)', [`Pedidos ${clave}`, `pedidos-${clave}`]);
  categoriaId = cat.insertId;
  const [p] = await pool.execute('INSERT INTO productos (categoria_id, nombre, slug, precio) VALUES (?, ?, ?, ?)', [categoriaId, 'Gorra snapshot', `gorra-${clave}`, '149.00']);
  productoId = p.insertId;
  for (const [color, hex] of [['Negro', '#14110F'], ['Jade', '#1F6F54']]) {
    const [v] = await pool.execute('INSERT INTO variantes (producto_id, sku, color_nombre, color_hex, talla, stock) VALUES (?, ?, ?, ?, ?, ?)', [productoId, `${color}-${clave}`, color, hex, 'S/M', 5]);
    if (color === 'Negro') varianteA = v.insertId; else varianteB = v.insertId;
  }
  await agent.post('/api/auth/login').send({ email: `pedido-${clave}@example.test`, password }).expect(200);
  await otro.post('/api/auth/login').send({ email: `otro-${clave}@example.test`, password }).expect(200);
});

afterEach(async () => {
  if (!usuarioId) return;
  await pool.execute('DELETE h FROM historial_estado_pedido h JOIN pedidos p ON p.id = h.pedido_id WHERE p.usuario_id = ?', [usuarioId]);
  await pool.execute('DELETE m FROM movimientos_inventario m JOIN pedidos p ON p.id = m.pedido_id WHERE p.usuario_id = ?', [usuarioId]);
  await pool.execute('DELETE FROM pedidos WHERE usuario_id = ?', [usuarioId]);
  await pool.execute('DELETE FROM carritos WHERE usuario_id = ?', [usuarioId]);
  if (productoId) {
    await pool.execute('UPDATE variantes SET stock = 5 WHERE producto_id = ?', [productoId]);
    await pool.execute('UPDATE productos SET nombre = ?, precio = ? WHERE id = ?', ['Gorra snapshot', '149.00', productoId]);
  }
});
afterAll(async () => {
  try {
    if (usuarioId) await pool.execute('DELETE FROM usuarios WHERE id IN (?, ?)', [usuarioId, otroId]);
    if (productoId) await pool.execute('DELETE FROM productos WHERE id = ?', [productoId]);
    if (categoriaId) await pool.execute('DELETE FROM categorias WHERE id = ?', [categoriaId]);
  } finally { await pool.end(); }
});

test('checkout crea snapshots, descuenta stock, registra movimiento e historial y vacía el carrito', async () => {
  await agent.post('/api/carrito/items').send({ varianteId: varianteA, cantidad: 2 }).expect(201);
  await agent.post('/api/pedidos').send({ ...datos, total: 0 }).expect(422);
  const { body } = await agent.post('/api/pedidos').send(datos).expect(201);
  const pedido = body.data;
  expect(pedido).toMatchObject({ codigo: `VIS-${String(pedido.id).padStart(6, '0')}`, estado: 'pagado', subtotal: '298.00', envio: '25.00', total: '323.00', pago_marca: 'visa', pago_ultimos4: '4242' });
  expect(pedido.items[0]).toMatchObject({ nombre_producto: 'Gorra snapshot', color_nombre: 'Negro', color_hex: '#14110F', talla: 'S/M', precio_unitario: '149.00', cantidad: 2, subtotal: '298.00' });
  expect(pedido.historial.map((h) => h.estado)).toEqual(['pagado']);
  const [[{ stock }]] = await pool.execute('SELECT stock FROM variantes WHERE id = ?', [varianteA]);
  expect(stock).toBe(3);
  const [movimientos] = await pool.execute('SELECT tipo, cantidad, stock_resultante FROM movimientos_inventario WHERE pedido_id = ?', [pedido.id]);
  expect(movimientos).toEqual([{ tipo: 'salida_venta', cantidad: -2, stock_resultante: 3 }]);
  expect((await agent.get('/api/carrito').expect(200)).body.data.items).toEqual([]);
  await pool.execute('UPDATE productos SET nombre = ?, precio = ? WHERE id = ?', ['Nombre cambiado', '199.00', productoId]);
  const historico = await agent.get(`/api/pedidos/${pedido.id}`).expect(200);
  expect(historico.body.data.items[0]).toMatchObject({ nombre_producto: 'Gorra snapshot', precio_unitario: '149.00' });
  await otro.get(`/api/pedidos/${pedido.id}`).expect(404);
  await otro.post(`/api/pedidos/${pedido.id}/cancelar`).send({}).expect(404);
});

test('checkout sin stock responde 409 y conserva stock, carrito y todas las tablas del pedido', async () => {
  await agent.post('/api/carrito/items').send({ varianteId: varianteA, cantidad: 1 }).expect(201);
  await agent.post('/api/carrito/items').send({ varianteId: varianteB, cantidad: 3 }).expect(201);
  await pool.execute('UPDATE variantes SET stock = 2 WHERE id = ?', [varianteB]);
  const fallo = await agent.post('/api/pedidos').send({ ...datos, metodo_pago: 'contra_entrega', pago_marca: null, pago_ultimos4: null }).expect(409);
  expect(fallo.body.error.detalles).toMatchObject({ varianteId: varianteB, stock: 2, solicitadas: 3 });
  const [stocks] = await pool.execute('SELECT stock FROM variantes WHERE producto_id = ? ORDER BY id', [productoId]);
  expect(stocks.map((v) => v.stock)).toEqual([5, 2]);
  const [items] = await pool.execute('SELECT ci.cantidad FROM carrito_items ci JOIN carritos c ON c.id = ci.carrito_id WHERE c.usuario_id = ? ORDER BY ci.variante_id', [usuarioId]);
  expect(items.map((i) => i.cantidad)).toEqual([1, 3]);
  const [[counts]] = await pool.execute(`SELECT (SELECT COUNT(*) FROM pedidos WHERE usuario_id = ?) pedidos,
    (SELECT COUNT(*) FROM movimientos_inventario WHERE variante_id IN (?, ?)) movimientos,
    (SELECT COUNT(*) FROM historial_estado_pedido WHERE usuario_id = ?) historial,
    (SELECT COUNT(*) FROM pedido_items pi JOIN pedidos p ON p.id = pi.pedido_id WHERE p.usuario_id = ?) items`, [usuarioId, varianteA, varianteB, usuarioId, usuarioId]);
  expect(counts).toEqual({ pedidos: 0, movimientos: 0, historial: 0, items: 0 });
});
