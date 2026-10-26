import { pool } from '../config/db.js';

const patron = (buscar = '') => `%${buscar.replace(/[!%_]/g, '!$&')}%`;
export async function resumen() {
  const [[metricas], [ventas], [recientes], [alertas]] = await Promise.all([
    pool.execute(`SELECT
      (SELECT COALESCE(SUM(total),0) FROM pedidos WHERE estado <> 'cancelado' AND creado_en >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')) ventas_mes,
      (SELECT COUNT(*) FROM pedidos WHERE estado = 'pendiente') pedidos_pendientes,
      (SELECT COUNT(*) FROM variantes v JOIN productos p ON p.id = v.producto_id WHERE v.activo = 1 AND p.activo = 1 AND v.stock <= v.stock_minimo) stock_bajo,
      (SELECT COUNT(*) FROM usuarios WHERE rol = 'cliente' AND creado_en >= DATE_FORMAT(CURRENT_DATE, '%Y-%m-01')) clientes_nuevos`),
    pool.execute(`WITH RECURSIVE dias AS (SELECT CURRENT_DATE - INTERVAL 6 DAY fecha UNION ALL SELECT fecha + INTERVAL 1 DAY FROM dias WHERE fecha < CURRENT_DATE)
      SELECT DATE_FORMAT(d.fecha,'%Y-%m-%d') fecha, COALESCE(SUM(p.total),0) total FROM dias d
      LEFT JOIN pedidos p ON DATE(p.creado_en) = d.fecha AND p.estado <> 'cancelado' GROUP BY d.fecha ORDER BY d.fecha`),
    pool.execute('SELECT p.id,p.codigo,p.estado,p.total,p.creado_en,u.nombre cliente FROM pedidos p JOIN usuarios u ON u.id = p.usuario_id ORDER BY p.id DESC LIMIT 5'),
    pool.execute('SELECT v.id,p.nombre,v.color_nombre,v.talla,v.stock,v.stock_minimo FROM variantes v JOIN productos p ON p.id=v.producto_id WHERE v.activo=1 AND p.activo=1 AND v.stock <= v.stock_minimo ORDER BY v.stock,v.id LIMIT 8'),
  ]);
  return { ...metricas[0], ventas, recientes, alertas };
}

export async function productos(buscar) {
  const [rows] = await pool.execute("SELECT p.*,c.nombre categoria FROM productos p JOIN categorias c ON c.id=p.categoria_id WHERE p.nombre LIKE ? ESCAPE '!' ORDER BY p.id DESC LIMIT 200", [patron(buscar)]);
  const [variantes] = await pool.execute("SELECT v.* FROM variantes v JOIN productos p ON p.id=v.producto_id WHERE p.nombre LIKE ? ESCAPE '!' ORDER BY v.id", [patron(buscar)]);
  return { rows, variantes };
}

export async function bloquearProducto(connection, id) {
  const [ids] = await connection.execute('SELECT id FROM variantes WHERE producto_id = ? ORDER BY id', [id]);
  for (const v of ids) await connection.execute('SELECT id FROM variantes WHERE id = ? FOR UPDATE', [v.id]);
  const [[producto]] = await connection.execute('SELECT * FROM productos WHERE id = ? FOR UPDATE', [id]);
  return producto;
}
export async function obtenerVariante(connection, id, bloquear = false) {
  const [[row]] = await connection.execute(`SELECT * FROM variantes WHERE id = ?${bloquear ? ' FOR UPDATE' : ''}`, [id]);
  return row;
}
export async function slugExiste(connection, slug, excepto = 0) {
  const [[row]] = await connection.execute('SELECT id FROM productos WHERE slug = ? AND id <> ?', [slug, excepto]); return Boolean(row);
}
export async function categoriaExiste(connection, id) {
  const [[row]] = await connection.execute('SELECT id FROM categorias WHERE id = ?', [id]); return Boolean(row);
}
export async function crearProducto(connection, datos, slug) {
  const [r] = await connection.execute('INSERT INTO productos (nombre,slug,categoria_id,descripcion,material,precio,destacado,activo) VALUES (?,?,?,?,?,?,?,?)', [datos.nombre,slug,datos.categoria_id,datos.descripcion,datos.material,datos.precio,datos.destacado,datos.activo]); return r.insertId;
}
export async function editarProducto(connection, id, datos, slug) {
  await connection.execute('UPDATE productos SET nombre=?,slug=?,categoria_id=?,descripcion=?,material=?,precio=?,destacado=?,activo=? WHERE id=?', [datos.nombre,slug,datos.categoria_id,datos.descripcion,datos.material,datos.precio,datos.destacado,datos.activo,id]);
}
export async function crearVariante(connection, productoId, datos, sku) {
  const [r] = await connection.execute('INSERT INTO variantes (producto_id,sku,color_nombre,color_hex,talla,stock,stock_minimo,activo) VALUES (?,?,?,?,?,0,?,?)', [productoId,sku,datos.color_nombre,datos.color_hex,datos.talla,datos.stock_minimo,datos.activo]); return r.insertId;
}
export async function editarVariante(connection, id, datos) {
  await connection.execute('UPDATE variantes SET color_nombre=?,color_hex=?,talla=?,stock_minimo=?,activo=? WHERE id=?', [datos.color_nombre,datos.color_hex,datos.talla,datos.stock_minimo,datos.activo,id]);
}
export async function referenciasPedidos(connection, productoId, varianteId) {
  const [[row]] = await connection.execute(`SELECT COUNT(*) total FROM pedido_items pi JOIN variantes v ON v.id=pi.variante_id WHERE ${varianteId ? 'v.id' : 'v.producto_id'} = ?`, [varianteId || productoId]); return Number(row.total);
}
export async function borrarVariante(connection, id, desactivar) {
  if (desactivar) return connection.execute('UPDATE variantes SET activo=0 WHERE id=?', [id]);
  await connection.execute('DELETE FROM carrito_items WHERE variante_id=?', [id]);
  await connection.execute('DELETE FROM movimientos_inventario WHERE variante_id=? AND pedido_id IS NULL', [id]);
  await connection.execute('DELETE FROM variantes WHERE id=?', [id]);
}
export async function borrarProducto(connection, id, desactivar) {
  if (desactivar) {
    await connection.execute('UPDATE productos SET activo=0 WHERE id=?', [id]);
    await connection.execute('UPDATE variantes SET activo=0 WHERE producto_id=?', [id]);
  } else {
    const [rows] = await connection.execute('SELECT id FROM variantes WHERE producto_id=? ORDER BY id', [id]);
    for (const v of rows) await borrarVariante(connection,v.id,false);
    await connection.execute('DELETE FROM productos WHERE id=?', [id]);
  }
}
export async function inventario(query) {
  const [rows] = await pool.execute(`SELECT v.*,p.nombre,p.slug,p.activo producto_activo,c.slug categoria_slug FROM variantes v JOIN productos p ON p.id=v.producto_id JOIN categorias c ON c.id=p.categoria_id
    WHERE (p.nombre LIKE ? ESCAPE '!' OR v.sku LIKE ? ESCAPE '!') ${query.bajo === '1' ? 'AND v.stock <= v.stock_minimo' : ''} ${query.agotado === '1' ? 'AND v.stock=0' : ''} ORDER BY v.stock,v.id LIMIT 200`, [patron(query.buscar),patron(query.buscar)]); return rows;
}
export async function movimientos() {
  const [rows] = await pool.execute('SELECT m.*,p.nombre,v.color_nombre,v.talla,u.nombre autor FROM movimientos_inventario m JOIN variantes v ON v.id=m.variante_id JOIN productos p ON p.id=v.producto_id LEFT JOIN usuarios u ON u.id=m.usuario_id ORDER BY m.id DESC LIMIT 100'); return rows;
}
export async function pedidos(query) {
  const filtros = []; const valores = [];
  if (query.estado) { filtros.push('p.estado=?'); valores.push(query.estado); }
  if (query.usuario) { filtros.push('p.usuario_id=?'); valores.push(query.usuario); }
  const [rows] = await pool.execute(`SELECT p.id,p.codigo,p.estado,p.total,p.creado_en,p.usuario_id,u.nombre cliente FROM pedidos p JOIN usuarios u ON u.id=p.usuario_id ${filtros.length ? `WHERE ${filtros.join(' AND ')}` : ''} ORDER BY p.id DESC LIMIT 200`,valores); return rows;
}
export async function usuarios(buscar, soloClientes) {
  const [rows] = await pool.execute(`SELECT u.id,u.nombre,u.email,u.telefono,u.rol,u.activo,u.creado_en,COUNT(p.id) total_pedidos,
    COALESCE(SUM(CASE WHEN p.estado <> 'cancelado' THEN p.total ELSE 0 END),0) monto_comprado FROM usuarios u LEFT JOIN pedidos p ON p.usuario_id=u.id
    WHERE (u.nombre LIKE ? ESCAPE '!' OR u.email LIKE ? ESCAPE '!') ${soloClientes ? "AND u.rol='cliente'" : ''} GROUP BY u.id ORDER BY u.id DESC LIMIT 200`, [patron(buscar),patron(buscar)]); return rows;
}
export async function usuario(connection, id) { const [[row]] = await connection.execute('SELECT id,rol,activo FROM usuarios WHERE id=? FOR UPDATE',[id]); return row; }
export async function editarUsuario(connection,id,datos) { await connection.execute('UPDATE usuarios SET rol=?,activo=? WHERE id=?',[datos.rol,datos.activo,id]); }
