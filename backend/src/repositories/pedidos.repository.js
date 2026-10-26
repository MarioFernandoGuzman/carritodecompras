import { Op, fn, col } from "sequelize";
import {
  CarritoItem,
  Producto,
  Variante,
  Pedido,
  PedidoItem,
  MovimientoInventario,
  HistorialEstadoPedido,
} from "../models/index.js";
import { options, plain, productJoin } from "./orm.js";
export const itemsCarrito = (t, carrito_id) =>
  CarritoItem.findAll({
    ...options(t),
    where: { carrito_id },
    attributes: ["variante_id", "cantidad"],
    order: [["variante_id", "ASC"]],
    raw: true,
  });
export const bloquearVariante = (t, id) =>
  Variante.findByPk(id, {
    ...options(t, true),
    attributes: ["id", "producto_id", "stock", "activo"],
    raw: true,
  });
export async function datosVariante(t, id) {
  const v = plain(
    await Variante.findByPk(id, {
      ...options(t),
      attributes: ["producto_id", "color_nombre", "color_hex", "talla"],
    }),
  );
  // La variante ya está bloqueada; el producto se bloquea después para mantener el orden.
  if (!v) return null;
  const p = await Producto.findByPk(v.producto_id, {
    transaction: t,
    lock: t.LOCK.SHARE,
    raw: true,
  });
  return {
    nombre: p.nombre,
    precio: p.precio,
    producto_activo: p.activo,
    color_nombre: v.color_nombre,
    color_hex: v.color_hex,
    talla: v.talla,
  };
}
export async function crearPedido(
  t,
  usuario_id,
  datos,
  importes,
  codigo,
  estado,
) {
  return (
    await Pedido.create(
      { ...datos, ...importes, usuario_id, codigo, estado },
      options(t),
    )
  ).id;
}
export const asignarCodigo = (t, id, codigo) =>
  Pedido.update({ codigo }, { ...options(t), where: { id } });
export const crearItem = (t, pedido_id, i) =>
  PedidoItem.create(
    {
      pedido_id,
      variante_id: i.variante_id,
      nombre_producto: i.nombre,
      color_nombre: i.color_nombre,
      color_hex: i.color_hex,
      talla: i.talla,
      precio_unitario: i.precio_unitario,
      cantidad: i.cantidad,
      subtotal: i.subtotal,
    },
    options(t),
  );
export const cambiarStock = (t, id, cantidad) =>
  Variante.increment({ stock: cantidad }, { ...options(t), where: { id } });
export const movimiento = (
  t,
  { varianteId, tipo, cantidad, stock, usuarioId, pedidoId, motivo = null },
) =>
  MovimientoInventario.create(
    {
      variante_id: varianteId,
      tipo,
      cantidad,
      stock_resultante: stock,
      usuario_id: usuarioId,
      pedido_id: pedidoId,
      motivo,
    },
    options(t),
  );
export const historial = (t, pedido_id, estado, usuario_id) =>
  HistorialEstadoPedido.create({ pedido_id, estado, usuario_id }, options(t));
export async function listar(usuario_id) {
  const rows = await Pedido.findAll({
    where: { usuario_id },
    order: [
      ["creado_en", "DESC"],
      ["id", "DESC"],
    ],
    raw: true,
  });
  if (!rows.length) return [];
  const counts = await PedidoItem.findAll({
    attributes: [
      "pedido_id",
      [fn("SUM", col("cantidad")), "cantidad_articulos"],
    ],
    where: { pedido_id: { [Op.in]: rows.map((r) => r.id) } },
    group: ["pedido_id"],
    raw: true,
  });
  const map = new Map(
    counts.map((r) => [r.pedido_id, Number(r.cantidad_articulos)]),
  );
  return rows.map(({ id, codigo, estado, total, creado_en }) => ({
    id,
    codigo,
    estado,
    total,
    creado_en,
    cantidad_articulos: map.get(id) || 0,
  }));
}
const detailFields = [
  "id",
  "codigo",
  "estado",
  "subtotal",
  "envio",
  "total",
  "nombre_destinatario",
  "telefono_contacto",
  "direccion_envio",
  "ciudad",
  "notas",
  "metodo_pago",
  "pago_marca",
  "pago_ultimos4",
  "creado_en",
  "actualizado_en",
];
export const buscar = (t, usuario_id, id, lock = false) =>
  Pedido.findOne({
    ...options(t, lock),
    where: { id, usuario_id },
    attributes: detailFields,
    raw: true,
  });
export async function itemsPedido(t, pedido_id) {
  const rows = await PedidoItem.findAll({
    ...options(t),
    where: { pedido_id },
    include: [
      { association: "variante", required: true, include: [productJoin] },
    ],
    order: [["variante_id", "ASC"]],
  });
  return rows.map((v) => {
    const { variante, ...r } = plain(v);
    return {
      ...r,
      slug: variante.producto.slug,
      categoria_slug: variante.producto.categoria.slug,
    };
  });
}
export const historialPedido = (t, pedido_id) =>
  HistorialEstadoPedido.findAll({
    ...options(t),
    where: { pedido_id },
    attributes: ["id", "estado", "creado_en"],
    order: [["id", "ASC"]],
    raw: true,
  });
export const cambiarEstado = (t, id, estado) =>
  Pedido.update({ estado }, { ...options(t), where: { id } });
export const cancelar = (t, id) => cambiarEstado(t, id, "cancelado");
export const buscarAdmin = (t, id, lock = false) =>
  Pedido.findByPk(id, { ...options(t, lock), raw: true });
