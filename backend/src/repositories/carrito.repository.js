export async function bloquearUsuario(connection, usuarioId) {
  await connection.execute('SELECT id FROM usuarios WHERE id = ? FOR UPDATE', [usuarioId]);
}

export async function buscarCarrito(connection, usuarioId) {
  const [[row]] = await connection.execute('SELECT id FROM carritos WHERE usuario_id = ?', [usuarioId]);
  return row?.id;
}

export async function crearCarrito(connection, usuarioId) {
  const [result] = await connection.execute('INSERT INTO carritos (usuario_id) VALUES (?)', [usuarioId]);
  return result.insertId;
}

export async function leerItems(connection, carritoId) {
  const [rows] = await connection.execute(
    `SELECT ci.id, ci.variante_id AS varianteId, ci.cantidad, p.nombre, p.slug, p.precio AS precio_unitario,
       p.activo AS producto_activo, c.slug AS categoria_slug, v.color_nombre, v.color_hex, v.talla, v.stock, v.activo
     FROM carrito_items ci JOIN variantes v ON v.id = ci.variante_id
     JOIN productos p ON p.id = v.producto_id JOIN categorias c ON c.id = p.categoria_id
     WHERE ci.carrito_id = ? ORDER BY v.id`, [carritoId],
  );
  return rows;
}

export async function buscarVariante(connection, varianteId) {
  const [[row]] = await connection.execute(
    `SELECT v.id, v.stock, v.activo, p.activo AS producto_activo
     FROM variantes v JOIN productos p ON p.id = v.producto_id WHERE v.id = ?`, [varianteId],
  );
  return row;
}

export async function buscarItem(connection, carritoId, itemId) {
  const [[row]] = await connection.execute(
    'SELECT id, variante_id AS varianteId, cantidad FROM carrito_items WHERE carrito_id = ? AND id = ?', [carritoId, itemId],
  );
  return row;
}

export async function cantidadDeVariante(connection, carritoId, varianteId) {
  const [[row]] = await connection.execute('SELECT cantidad FROM carrito_items WHERE carrito_id = ? AND variante_id = ?', [carritoId, varianteId]);
  return row?.cantidad || 0;
}

export async function guardarItem(connection, carritoId, varianteId, cantidad) {
  await connection.execute(
    `INSERT INTO carrito_items (carrito_id, variante_id, cantidad) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE cantidad = ?`, [carritoId, varianteId, cantidad, cantidad],
  );
}

export async function eliminarItem(connection, carritoId, itemId) {
  await connection.execute('DELETE FROM carrito_items WHERE carrito_id = ? AND id = ?', [carritoId, itemId]);
}

export async function vaciar(connection, carritoId) {
  await connection.execute('DELETE FROM carrito_items WHERE carrito_id = ?', [carritoId]);
}

export async function actualizarFecha(connection, carritoId) {
  await connection.execute('UPDATE carritos SET actualizado_en = CURRENT_TIMESTAMP WHERE id = ?', [carritoId]);
}
