import { pool } from '../config/db.js';

const ordenes = {
  precio_asc: 'precio ASC, id ASC',
  precio_desc: 'precio DESC, id DESC',
  nuevos: 'creado_en DESC, id DESC',
  destacados: 'destacado DESC, creado_en DESC, id DESC',
};
const columnas = `p.id, p.nombre, p.slug, p.precio, p.destacado, p.creado_en,
  c.id AS categoria_id, c.nombre AS categoria_nombre, c.slug AS categoria_slug`;

export async function listarCategorias() {
  const [rows] = await pool.execute('SELECT id, nombre, slug, descripcion FROM categorias ORDER BY id');
  return rows;
}

export async function listarProductos(query) {
  const condiciones = ['p.activo = 1'];
  const valores = [];
  if (query.categoria) { condiciones.push('c.slug = ?'); valores.push(query.categoria); }
  if (query.min !== undefined) { condiciones.push('p.precio >= ?'); valores.push(query.min); }
  if (query.max !== undefined) { condiciones.push('p.precio <= ?'); valores.push(query.max); }
  if (query.buscar) {
    const palabras = query.buscar.match(/[\p{L}\p{N}]+/gu)?.filter((word) => word.length >= 3) || [];
    if (palabras.length) {
      condiciones.push('MATCH(p.nombre, p.descripcion) AGAINST(? IN BOOLEAN MODE)');
      valores.push(palabras.map((word) => `+${word}*`).join(' '));
    } else {
      condiciones.push("(p.nombre LIKE ? ESCAPE '!' OR p.descripcion LIKE ? ESCAPE '!')");
      const patron = `%${query.buscar.replace(/[!%_]/g, '!$&')}%`;
      valores.push(patron, patron);
    }
  }
  const variante = ['v.producto_id = p.id', 'v.activo = 1'];
  if (query.color) { variante.push('v.color_nombre = ?'); valores.push(query.color); }
  if (query.talla) { variante.push('v.talla = ?'); valores.push(query.talla); }
  condiciones.push(`EXISTS (SELECT 1 FROM variantes v WHERE ${variante.join(' AND ')})`);
  const orden = ordenes[query.orden];
  const [rows] = await pool.execute(
    `WITH filtrados AS (
       SELECT ${columnas},
         NOT EXISTS (SELECT 1 FROM variantes v WHERE v.producto_id = p.id AND v.activo = 1 AND v.stock > 0) AS agotado
       FROM productos p JOIN categorias c ON c.id = p.categoria_id
       WHERE ${condiciones.join(' AND ')}
     ), paginados AS (
       SELECT * FROM filtrados ORDER BY ${orden} LIMIT ? OFFSET ?
     )
     SELECT paginados.*, conteo.total
     FROM (SELECT COUNT(*) AS total FROM filtrados) conteo
     LEFT JOIN paginados ON TRUE
     ORDER BY ${orden}`,
    [...valores, String(query.limite), String((query.pagina - 1) * query.limite)],
  );
  return { rows: rows.filter((row) => row.id !== null), total: Number(rows[0].total) };
}

export async function coloresDeProductos(ids) {
  if (!ids.length) return [];
  const [rows] = await pool.execute(
    `SELECT producto_id, color_nombre AS nombre, color_hex AS hex, MAX(stock > 0) AS disponible
     FROM variantes WHERE activo = 1 AND producto_id IN (${ids.map(() => '?').join(',')})
     GROUP BY producto_id, color_nombre, color_hex ORDER BY MIN(id)`, ids,
  );
  return rows;
}

export async function buscarProducto(slug) {
  const [[row]] = await pool.execute(
    `SELECT ${columnas}, p.descripcion, p.material FROM productos p
     JOIN categorias c ON c.id = p.categoria_id
     WHERE p.slug = ? AND p.activo = 1
       AND EXISTS (SELECT 1 FROM variantes v WHERE v.producto_id = p.id AND v.activo = 1)`, [slug],
  );
  return row;
}

export async function variantesDeProducto(id) {
  const [rows] = await pool.execute(
    `SELECT id, sku, color_nombre, color_hex, talla, stock, stock_minimo
     FROM variantes WHERE producto_id = ? AND activo = 1 ORDER BY id`, [id],
  );
  return rows;
}
