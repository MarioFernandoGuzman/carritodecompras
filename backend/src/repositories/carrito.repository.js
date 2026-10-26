import { Usuario, Carrito, CarritoItem, Variante } from "../models/index.js";
import { options, plain, productJoin } from "./orm.js";
export const bloquearUsuario = (t, id) =>
  Usuario.findByPk(id, { ...options(t, true), attributes: ["id"] });
export async function buscarCarrito(t, usuario_id) {
  return (
    await Carrito.findOne({ ...options(t), where: { usuario_id }, raw: true })
  )?.id;
}
export async function crearCarrito(t, usuario_id) {
  return (await Carrito.create({ usuario_id }, options(t))).id;
}
export async function leerItems(t, carrito_id) {
  const rows = await CarritoItem.findAll({
    ...options(t),
    where: { carrito_id },
    include: [
      { association: "variante", required: true, include: [productJoin] },
    ],
    order: [["variante_id", "ASC"]],
  });
  return rows.map((value) => {
    const r = plain(value),
      v = r.variante,
      p = v.producto;
    return {
      id: r.id,
      varianteId: v.id,
      cantidad: r.cantidad,
      nombre: p.nombre,
      slug: p.slug,
      precio_unitario: p.precio,
      producto_activo: p.activo,
      categoria_slug: p.categoria.slug,
      color_nombre: v.color_nombre,
      color_hex: v.color_hex,
      talla: v.talla,
      stock: v.stock,
      activo: v.activo,
    };
  });
}
export async function buscarVariante(t, id) {
  const r = plain(
    await Variante.findByPk(id, {
      ...options(t),
      include: [{ association: "producto", required: true }],
    }),
  );
  return (
    r && {
      id: r.id,
      stock: r.stock,
      activo: r.activo,
      producto_activo: r.producto.activo,
    }
  );
}
export async function buscarItem(t, carrito_id, id) {
  const r = await CarritoItem.findOne({
    ...options(t),
    where: { carrito_id, id },
    raw: true,
  });
  return r && { id: r.id, varianteId: r.variante_id, cantidad: r.cantidad };
}
export async function cantidadDeVariante(t, carrito_id, variante_id) {
  return (
    (
      await CarritoItem.findOne({
        ...options(t),
        where: { carrito_id, variante_id },
        raw: true,
      })
    )?.cantidad || 0
  );
}
export const guardarItem = (t, carrito_id, variante_id, cantidad) =>
  CarritoItem.upsert({ carrito_id, variante_id, cantidad }, options(t));
export const eliminarItem = (t, carrito_id, id) =>
  CarritoItem.destroy({ ...options(t), where: { carrito_id, id } });
export const vaciar = (t, carrito_id) =>
  CarritoItem.destroy({ ...options(t), where: { carrito_id } });
export const actualizarFecha = (t, id) =>
  Carrito.update(
    { actualizado_en: new Date() },
    { ...options(t), where: { id } },
  );
