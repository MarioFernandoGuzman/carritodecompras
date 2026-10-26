import { Op, fn, col, where as expression } from "sequelize";
import { sequelize } from "../config/db.js";
import {
  Usuario,
  Producto,
  Variante,
  CarritoItem,
  Pedido,
  PedidoItem,
  MovimientoInventario,
} from "../models/index.js";
import { options, plain, contains, productJoin, categoryJoin } from "./orm.js";
const dayString = (date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Guatemala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
const midnight = (value) => new Date(`${value}T00:00:00-06:00`);
export async function resumen() {
  const today = dayString(new Date()),
    start = midnight(today),
    first = midnight(today.slice(0, 7) + "-01");
  const from = new Date(start.getTime() - 6 * 86400000);
  const [sales, pending, low, newClients, days, recent, alerts] =
    await Promise.all([
      Pedido.sum("total", {
        where: {
          estado: { [Op.ne]: "cancelado" },
          creado_en: { [Op.gte]: first },
        },
      }),
      Pedido.count({ where: { estado: "pendiente" } }),
      Variante.count({
        where: {
          activo: 1,
          [Op.and]: expression(col("stock"), Op.lte, col("stock_minimo")),
        },
        include: [
          { association: "producto", required: true, where: { activo: 1 } },
        ],
      }),
      Usuario.count({
        where: { rol: "cliente", creado_en: { [Op.gte]: first } },
      }),
      Pedido.findAll({
        attributes: [
          [fn("DATE_FORMAT", col("creado_en"), "%Y-%m-%d"), "fecha"],
          [fn("SUM", col("total")), "total"],
        ],
        where: {
          estado: { [Op.ne]: "cancelado" },
          creado_en: {
            [Op.gte]: from,
            [Op.lt]: new Date(start.getTime() + 86400000),
          },
        },
        group: [fn("DATE_FORMAT", col("creado_en"), "%Y-%m-%d")],
        raw: true,
      }),
      Pedido.findAll({
        include: [
          { association: "usuario", attributes: ["nombre"], required: true },
        ],
        order: [["id", "DESC"]],
        limit: 5,
      }),
      Variante.findAll({
        where: {
          activo: 1,
          [Op.and]: expression(col("stock"), Op.lte, col("stock_minimo")),
        },
        include: [
          {
            association: "producto",
            required: true,
            where: { activo: 1 },
            attributes: ["nombre"],
          },
        ],
        order: [
          ["stock", "ASC"],
          ["id", "ASC"],
        ],
        limit: 8,
      }),
    ]);
  const totals = new Map(days.map((d) => [d.fecha, d.total]));
  return {
    ventas_mes: Number(sales || 0).toFixed(2),
    pedidos_pendientes: pending,
    stock_bajo: low,
    clientes_nuevos: newClients,
    ventas: Array.from({ length: 7 }, (_, i) => {
      const fecha = dayString(new Date(from.getTime() + i * 86400000));
      return { fecha, total: Number(totals.get(fecha) || 0).toFixed(2) };
    }),
    recientes: recent.map((v) => {
      const p = plain(v);
      return {
        id: p.id,
        codigo: p.codigo,
        estado: p.estado,
        total: p.total,
        creado_en: p.creado_en,
        cliente: p.usuario.nombre,
      };
    }),
    alertas: alerts.map((v) => {
      const p = plain(v);
      return {
        id: p.id,
        nombre: p.producto.nombre,
        color_nombre: p.color_nombre,
        talla: p.talla,
        stock: p.stock,
        stock_minimo: p.stock_minimo,
      };
    }),
  };
}
export async function productos(buscar) {
  const rows = await Producto.findAll({
    where: { nombre: contains(buscar) },
    include: [categoryJoin],
    order: [["id", "DESC"]],
    limit: 200,
  });
  const variants = await Variante.findAll({
    include: [
      {
        association: "producto",
        required: true,
        where: { nombre: contains(buscar) },
        attributes: [],
      },
    ],
    order: [["id", "ASC"]],
    raw: true,
  });
  return {
    rows: rows.map((v) => {
      const { categoria, ...p } = plain(v);
      return { ...p, categoria: categoria.nombre };
    }),
    variantes: variants,
  };
}
export async function bloquearProducto(t, id) {
  const ids = await Variante.findAll({
    ...options(t),
    where: { producto_id: id },
    attributes: ["id"],
    order: [["id", "ASC"]],
    raw: true,
  });
  for (const v of ids)
    await Variante.findByPk(v.id, { ...options(t, true), attributes: ["id"] });
  return Producto.findByPk(id, { ...options(t, true), raw: true });
}
export const obtenerVariante = (t, id, lock = false) =>
  Variante.findByPk(id, { ...options(t, lock), raw: true });
export const slugExiste = async (t, slug, id = 0) =>
  Boolean(
    await Producto.findOne({
      ...options(t),
      where: { slug, id: { [Op.ne]: id } },
      attributes: ["id"],
    }),
  );
export const categoriaExiste = async (t, id) =>
  Boolean(
    await sequelize.models.Categoria.findByPk(id, {
      ...options(t),
      attributes: ["id"],
    }),
  );
export const crearProducto = async (t, datos, slug) =>
  (await Producto.create({ ...datos, slug }, options(t))).id;
export const editarProducto = (t, id, datos, slug) =>
  Producto.update({ ...datos, slug }, { ...options(t), where: { id } });
export const crearVariante = async (t, producto_id, datos, sku) =>
  (await Variante.create({ ...datos, producto_id, sku, stock: 0 }, options(t)))
    .id;
export const editarVariante = (
  t,
  id,
  { color_nombre, color_hex, talla, stock_minimo, activo },
) =>
  Variante.update(
    { color_nombre, color_hex, talla, stock_minimo, activo },
    { ...options(t), where: { id } },
  );
export const referenciasPedidos = (t, productoId, varianteId) =>
  PedidoItem.count({
    ...options(t),
    where: varianteId ? { variante_id: varianteId } : {},
    include: varianteId
      ? []
      : [
          {
            association: "variante",
            required: true,
            where: { producto_id: productoId },
            attributes: [],
          },
        ],
  });
export async function borrarVariante(t, id, desactivar) {
  if (desactivar)
    return Variante.update({ activo: 0 }, { ...options(t), where: { id } });
  await CarritoItem.destroy({ ...options(t), where: { variante_id: id } });
  await MovimientoInventario.destroy({
    ...options(t),
    where: { variante_id: id, pedido_id: null },
  });
  await Variante.destroy({ ...options(t), where: { id } });
}
export async function borrarProducto(t, id, desactivar) {
  if (desactivar) {
    await Producto.update({ activo: 0 }, { ...options(t), where: { id } });
    await Variante.update(
      { activo: 0 },
      { ...options(t), where: { producto_id: id } },
    );
    return;
  }
  const variants = await Variante.findAll({
    ...options(t),
    where: { producto_id: id },
    order: [["id", "ASC"]],
    attributes: ["id"],
    raw: true,
  });
  for (const v of variants) await borrarVariante(t, v.id, false);
  await Producto.destroy({ ...options(t), where: { id } });
}
export async function inventario(query) {
  const filters = [
    {
      [Op.or]: [
        { "$producto.nombre$": contains(query.buscar) },
        { sku: contains(query.buscar) },
      ],
    },
  ];
  if (query.bajo === "1")
    filters.push(expression(col("stock"), Op.lte, col("stock_minimo")));
  if (query.agotado === "1") filters.push({ stock: 0 });
  const rows = await Variante.findAll({
    where: { [Op.and]: filters },
    include: [productJoin],
    order: [
      ["stock", "ASC"],
      ["id", "ASC"],
    ],
    limit: 200,
  });
  return rows.map((v) => {
    const { producto, ...r } = plain(v);
    return {
      ...r,
      nombre: producto.nombre,
      slug: producto.slug,
      producto_activo: producto.activo,
      categoria_slug: producto.categoria.slug,
    };
  });
}
export async function movimientos() {
  const rows = await MovimientoInventario.findAll({
    include: [
      {
        association: "variante",
        required: true,
        include: [{ association: "producto", required: true }],
      },
      { association: "usuario", required: false, attributes: ["nombre"] },
    ],
    order: [["id", "DESC"]],
    limit: 100,
  });
  return rows.map((v) => {
    const { variante, usuario, ...r } = plain(v);
    return {
      ...r,
      nombre: variante.producto.nombre,
      color_nombre: variante.color_nombre,
      talla: variante.talla,
      autor: usuario?.nombre || null,
    };
  });
}
export async function pedidos(query) {
  const where = {
    ...(query.estado ? { estado: query.estado } : {}),
    ...(query.usuario ? { usuario_id: query.usuario } : {}),
  };
  const rows = await Pedido.findAll({
    where,
    include: [
      { association: "usuario", required: true, attributes: ["nombre"] },
    ],
    order: [["id", "DESC"]],
    limit: 200,
  });
  return rows.map((v) => {
    const p = plain(v);
    return {
      id: p.id,
      codigo: p.codigo,
      estado: p.estado,
      total: p.total,
      creado_en: p.creado_en,
      usuario_id: p.usuario_id,
      cliente: p.usuario.nombre,
    };
  });
}
export async function usuarios(buscar, soloClientes) {
  const users = await Usuario.findAll({
    attributes: [
      "id",
      "nombre",
      "email",
      "telefono",
      "rol",
      "activo",
      "creado_en",
    ],
    where: {
      [Op.or]: [{ nombre: contains(buscar) }, { email: contains(buscar) }],
      ...(soloClientes ? { rol: "cliente" } : {}),
    },
    order: [["id", "DESC"]],
    limit: 200,
    raw: true,
  });
  if (!users.length) return [];
  const scope = { usuario_id: { [Op.in]: users.map((u) => u.id) } };
  const [counts, amounts] = await Promise.all([
    Pedido.findAll({
      where: scope,
      attributes: ["usuario_id", [fn("COUNT", col("id")), "total_pedidos"]],
      group: ["usuario_id"],
      raw: true,
    }),
    Pedido.findAll({
      where: { ...scope, estado: { [Op.ne]: "cancelado" } },
      attributes: ["usuario_id", [fn("SUM", col("total")), "monto_comprado"]],
      group: ["usuario_id"],
      raw: true,
    }),
  ]);
  const c = new Map(counts.map((x) => [x.usuario_id, Number(x.total_pedidos)])),
    a = new Map(amounts.map((x) => [x.usuario_id, x.monto_comprado]));
  return users.map((u) => ({
    ...u,
    total_pedidos: c.get(u.id) || 0,
    monto_comprado: Number(a.get(u.id) || 0).toFixed(2),
  }));
}
export const usuario = (t, id) =>
  Usuario.findByPk(id, {
    ...options(t, true),
    attributes: ["id", "rol", "activo"],
    raw: true,
  });
export const editarUsuario = (t, id, datos) =>
  Usuario.update(datos, { ...options(t), where: { id } });
