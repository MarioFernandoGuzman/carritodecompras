import { randomBytes } from 'node:crypto';
import { pool } from '../config/db.js';
import { TARIFA_ENVIO_CENTAVOS, ENVIO_GRATIS_DESDE_CENTAVOS } from '../config/envio.js';
import * as repository from '../repositories/pedidos.repository.js';
import * as carrito from '../repositories/carrito.repository.js';
import { HttpError } from '../utils/HttpError.js';
import { estiloGorra } from '../utils/estiloGorra.js';

const dinero = (centavos) => (centavos / 100).toFixed(2);

async function transaccion(usuarioId, operacion) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await carrito.bloquearUsuario(connection, usuarioId);
    const resultado = await operacion(connection);
    await connection.commit();
    return resultado;
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_LOCK_DEADLOCK' || error.code === 'ER_LOCK_WAIT_TIMEOUT') throw new HttpError(409, 'El inventario cambió. Revisa tu carrito e inténtalo de nuevo.');
    throw error;
  } finally { connection.release(); }
}

async function detalle(connection, usuarioId, id, pedido) {
  pedido ||= await repository.buscar(connection, usuarioId, id);
  if (!pedido) throw new HttpError(404, 'No encontramos ese pedido.');
  const items = await repository.itemsPedido(connection, id);
  return { ...pedido, items: items.map(({ categoria_slug, ...item }) => ({ ...item, estilo: estiloGorra(categoria_slug, item.slug) })),
    historial: await repository.historialPedido(connection, id) };
}

export const listarPedidos = (usuarioId) => repository.listar(usuarioId);

export async function obtenerPedido(usuarioId, id) {
  const connection = await pool.getConnection();
  try { return await detalle(connection, usuarioId, id); }
  finally { connection.release(); }
}

export const crearPedido = (usuarioId, datos) => transaccion(usuarioId, async (connection) => {
  const carritoId = await carrito.buscarCarrito(connection, usuarioId);
  const items = carritoId ? await repository.itemsCarrito(connection, carritoId) : [];
  if (!items.length) throw new HttpError(409, 'Tu carrito está vacío. Agrega una gorra para continuar.');
  const variantes = new Map();
  // Bloqueos individuales en orden ascendente, sin adquirir primero bloqueos compartidos de inventario.
  for (const item of items) variantes.set(item.variante_id, await repository.bloquearVariante(connection, item.variante_id));
  let subtotal = 0;
  const snapshots = [];
  for (const item of items) {
    const variante = variantes.get(item.variante_id);
    const datosVariante = variante ? await repository.datosVariante(connection, item.variante_id) : null;
    const stock = variante?.activo && datosVariante?.producto_activo ? variante.stock : 0;
    if (stock < item.cantidad) throw new HttpError(409,
      `${datosVariante?.nombre || 'Una gorra'} (${datosVariante?.color_nombre || 'variante'} ${datosVariante?.talla || item.variante_id}): solo quedan ${stock} unidades.`,
      { varianteId: item.variante_id, stock, solicitadas: item.cantidad });
    const unitario = Math.round(Number(datosVariante.precio) * 100);
    const linea = unitario * item.cantidad;
    subtotal += linea;
    if (!Number.isSafeInteger(subtotal) || subtotal > 9999999999) throw new HttpError(422, 'El importe del pedido supera el límite permitido.');
    snapshots.push({ ...item, ...datosVariante, precio_unitario: dinero(unitario), subtotal: dinero(linea) });
  }
  const envio = subtotal >= ENVIO_GRATIS_DESDE_CENTAVOS ? 0 : TARIFA_ENVIO_CENTAVOS;
  if (subtotal + envio > 9999999999) throw new HttpError(422, 'El importe del pedido supera el límite permitido.');
  const estado = datos.metodo_pago === 'tarjeta' ? 'pagado' : 'pendiente';
  const id = await repository.crearPedido(connection, usuarioId, datos,
    { subtotal: dinero(subtotal), envio: dinero(envio), total: dinero(subtotal + envio) }, `TMP-${randomBytes(8).toString('hex')}`, estado);
  await repository.asignarCodigo(connection, id, `VIS-${String(id).padStart(6, '0')}`);
  for (const item of snapshots) {
    await repository.crearItem(connection, id, item);
    await repository.cambiarStock(connection, item.variante_id, -item.cantidad);
    await repository.movimiento(connection, { varianteId: item.variante_id, tipo: 'salida_venta', cantidad: -item.cantidad,
      stock: variantes.get(item.variante_id).stock - item.cantidad, usuarioId, pedidoId: id });
  }
  await repository.historial(connection, id, estado, usuarioId);
  await carrito.vaciar(connection, carritoId);
  await carrito.actualizarFecha(connection, carritoId);
  return detalle(connection, usuarioId, id);
});

export const cancelarPedido = (usuarioId, id) => transaccion(usuarioId, async (connection) => {
  const pedido = await repository.buscar(connection, usuarioId, id, true);
  if (!pedido) throw new HttpError(404, 'No encontramos ese pedido.');
  if (!['pendiente', 'pagado'].includes(pedido.estado)) throw new HttpError(409, 'Este pedido ya no se puede cancelar.');
  const items = await repository.itemsPedido(connection, id);
  const variantes = new Map();
  for (const item of items) variantes.set(item.variante_id, await repository.bloquearVariante(connection, item.variante_id));
  for (const item of items) {
    const variante = variantes.get(item.variante_id);
    if (!variante || variante.stock + item.cantidad > 2147483647) throw new HttpError(409, 'No se pudo restituir el inventario de una variante.');
    await repository.cambiarStock(connection, item.variante_id, item.cantidad);
    await repository.movimiento(connection, { varianteId: item.variante_id, tipo: 'devolucion_cancelacion', cantidad: item.cantidad,
      stock: variante.stock + item.cantidad, usuarioId, pedidoId: id });
  }
  await repository.cancelar(connection, id);
  await repository.historial(connection, id, 'cancelado', usuarioId);
  return detalle(connection, usuarioId, id);
});
