import { pool } from '../config/db.js';

export async function itemsCarrito(connection, carritoId) {
  const [rows] = await connection.execute('SELECT variante_id, cantidad FROM carrito_items WHERE carrito_id = ? ORDER BY variante_id', [carritoId]);
  return rows;
}

export async function bloquearVariante(connection, id) {
  const [[row]] = await connection.execute('SELECT id, producto_id, stock, activo FROM variantes WHERE id = ? FOR UPDATE', [id]);
  return row;
}

export async function datosVariante(connection, id) {
  const [[row]] = await connection.execute(
    `SELECT p.nombre, p.precio, p.activo AS producto_activo, v.color_nombre, v.color_hex, v.talla
     FROM variantes v JOIN productos p ON p.id = v.producto_id WHERE v.id = ? FOR SHARE`, [id],
  );
  return row;
}

export async function crearPedido(connection, usuarioId, datos, importes, codigoTemporal, estado) {
  const [result] = await connection.execute(
    `INSERT INTO pedidos (usuario_id, codigo, estado, subtotal, envio, total, nombre_destinatario,
       telefono_contacto, direccion_envio, ciudad, notas, metodo_pago, pago_marca, pago_ultimos4)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [usuarioId, codigoTemporal, estado, importes.subtotal, importes.envio, importes.total, datos.nombre_destinatario,
      datos.telefono_contacto, datos.direccion_envio, datos.ciudad, datos.notas, datos.metodo_pago,
      datos.pago_marca || null, datos.pago_ultimos4 || null],
  );
  return result.insertId;
}

export async function asignarCodigo(connection, id, codigo) {
  await connection.execute('UPDATE pedidos SET codigo = ? WHERE id = ?', [codigo, id]);
}

export async function crearItem(connection, pedidoId, item) {
  await connection.execute(
    `INSERT INTO pedido_items (pedido_id, variante_id, nombre_producto, color_nombre, color_hex, talla, precio_unitario, cantidad, subtotal)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [pedidoId, item.variante_id, item.nombre, item.color_nombre, item.color_hex, item.talla, item.precio_unitario, item.cantidad, item.subtotal],
  );
}

export async function cambiarStock(connection, varianteId, cantidad) {
  await connection.execute('UPDATE variantes SET stock = stock + ? WHERE id = ?', [cantidad, varianteId]);
}

export async function movimiento(connection, { varianteId, tipo, cantidad, stock, usuarioId, pedidoId, motivo = null }) {
  await connection.execute(
    `INSERT INTO movimientos_inventario (variante_id, tipo, cantidad, stock_resultante, usuario_id, pedido_id, motivo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`, [varianteId, tipo, cantidad, stock, usuarioId, pedidoId, motivo],
  );
}

export async function historial(connection, pedidoId, estado, usuarioId) {
  await connection.execute('INSERT INTO historial_estado_pedido (pedido_id, estado, usuario_id) VALUES (?, ?, ?)', [pedidoId, estado, usuarioId]);
}

export async function listar(usuarioId) {
  const [rows] = await pool.execute(
    `SELECT p.id, p.codigo, p.estado, p.total, p.creado_en, COALESCE(SUM(pi.cantidad), 0) AS cantidad_articulos
     FROM pedidos p LEFT JOIN pedido_items pi ON pi.pedido_id = p.id
     WHERE p.usuario_id = ? GROUP BY p.id ORDER BY p.creado_en DESC, p.id DESC`, [usuarioId],
  );
  return rows;
}

export async function buscar(connection, usuarioId, id, bloquear = false) {
  const [[row]] = await connection.execute(
    `SELECT id, codigo, estado, subtotal, envio, total, nombre_destinatario, telefono_contacto, direccion_envio,
      ciudad, notas, metodo_pago, pago_marca, pago_ultimos4, creado_en, actualizado_en
     FROM pedidos WHERE id = ? AND usuario_id = ?${bloquear ? ' FOR UPDATE' : ''}`, [id, usuarioId],
  );
  return row;
}

export async function itemsPedido(connection, pedidoId) {
  const [rows] = await connection.execute(
    `SELECT pi.*, p.slug, c.slug AS categoria_slug
     FROM pedido_items pi JOIN variantes v ON v.id = pi.variante_id
     JOIN productos p ON p.id = v.producto_id JOIN categorias c ON c.id = p.categoria_id
     WHERE pi.pedido_id = ? ORDER BY pi.variante_id`, [pedidoId],
  );
  return rows;
}

export async function historialPedido(connection, pedidoId) {
  const [rows] = await connection.execute('SELECT id, estado, creado_en FROM historial_estado_pedido WHERE pedido_id = ? ORDER BY id', [pedidoId]);
  return rows;
}

export async function cancelar(connection, pedidoId) {
  await connection.execute("UPDATE pedidos SET estado = 'cancelado' WHERE id = ?", [pedidoId]);
}

export async function buscarAdmin(connection,id,bloquear=false) {
  const [[row]]=await connection.execute(`SELECT * FROM pedidos WHERE id=?${bloquear?' FOR UPDATE':''}`,[id]);return row;
}
export async function cambiarEstado(connection,id,estado) { await connection.execute('UPDATE pedidos SET estado=? WHERE id=?',[estado,id]); }
