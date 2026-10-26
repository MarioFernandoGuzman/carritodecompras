import { Op } from "sequelize";
import { Categoria, Producto, Variante } from "../models/index.js";
import { categoryJoin, contains, productRow } from "./orm.js";
const orders = {
  precio_asc: [
    ["precio", "ASC"],
    ["id", "ASC"],
  ],
  precio_desc: [
    ["precio", "DESC"],
    ["id", "DESC"],
  ],
  nuevos: [
    ["creado_en", "DESC"],
    ["id", "DESC"],
  ],
  destacados: [
    ["destacado", "DESC"],
    ["creado_en", "DESC"],
    ["id", "DESC"],
  ],
};
export const listarCategorias = () =>
  Categoria.findAll({ order: [["id", "ASC"]], raw: true });
export async function listarProductos(query) {
  const variantWhere = { activo: 1 };
  if (query.color) variantWhere.color_nombre = query.color;
  if (query.talla) variantWhere.talla = query.talla;
  const matching = await Variante.findAll({
    attributes: ["producto_id"],
    where: variantWhere,
    group: ["producto_id"],
    raw: true,
  });
  const where = {
    activo: 1,
    id: { [Op.in]: matching.map((v) => v.producto_id) },
  };
  if (query.min !== undefined || query.max !== undefined)
    where.precio = {
      ...(query.min !== undefined ? { [Op.gte]: query.min } : {}),
      ...(query.max !== undefined ? { [Op.lte]: query.max } : {}),
    };
  if (query.buscar) {
    const words = query.buscar.trim().split(/\s+/u);
    where[Op.and] = words.map((word) => ({
      [Op.or]: [{ nombre: contains(word) }, { descripcion: contains(word) }],
    }));
  }
  const include = [
    {
      ...categoryJoin,
      ...(query.categoria ? { where: { slug: query.categoria } } : {}),
    },
  ];
  const result = await Producto.findAndCountAll({
    where,
    include,
    order: orders[query.orden] || orders.destacados,
    limit: query.limite,
    offset: (query.pagina - 1) * query.limite,
    distinct: true,
  });
  const ids = result.rows.map((p) => p.id);
  const stock = ids.length
    ? await Variante.findAll({
        attributes: ["producto_id", "stock"],
        where: { producto_id: { [Op.in]: ids }, activo: 1 },
        raw: true,
      })
    : [];
  const available = new Set(
    stock.filter((v) => v.stock > 0).map((v) => v.producto_id),
  );
  return {
    rows: result.rows.map((p) => ({
      ...productRow(p),
      agotado: !available.has(p.id),
    })),
    total: result.count,
  };
}
export async function coloresDeProductos(ids) {
  if (!ids.length) return [];
  const rows = await Variante.findAll({
    where: { producto_id: { [Op.in]: ids }, activo: 1 },
    order: [["id", "ASC"]],
    raw: true,
  });
  const groups = new Map();
  for (const r of rows) {
    const key = JSON.stringify([r.producto_id, r.color_nombre, r.color_hex]);
    const old = groups.get(key);
    groups.set(key, {
      producto_id: r.producto_id,
      nombre: r.color_nombre,
      hex: r.color_hex,
      disponible: Boolean(old?.disponible || r.stock > 0),
    });
  }
  return [...groups.values()];
}
export async function buscarProducto(slug) {
  const p = await Producto.findOne({
    where: { slug, activo: 1 },
    include: [categoryJoin],
  });
  if (
    !p ||
    !(await Variante.count({ where: { producto_id: p.id, activo: 1 } }))
  )
    return null;
  return productRow(p);
}
export const variantesDeProducto = (producto_id) =>
  Variante.findAll({
    where: { producto_id, activo: 1 },
    attributes: [
      "id",
      "sku",
      "color_nombre",
      "color_hex",
      "talla",
      "stock",
      "stock_minimo",
    ],
    order: [["id", "ASC"]],
    raw: true,
  });
