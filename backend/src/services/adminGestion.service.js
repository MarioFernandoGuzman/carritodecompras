import { randomBytes } from "node:crypto";
import { sequelize } from "../config/db.js";
import { databaseErrorCode } from "../utils/databaseErrorCode.js";
import * as repository from "../repositories/adminGestion.repository.js";
import * as inventario from "../repositories/pedidos.repository.js";
import { estiloGorra } from "../utils/estiloGorra.js";
import { HttpError } from "../utils/HttpError.js";

async function transaccion(actorId, operacion) {
  try {
    return await sequelize.transaction(async (con) => {
      const actor = await repository.usuario(con, actorId);
      if (!actor?.activo || actor.rol !== "admin")
        throw new HttpError(
          403,
          "No tienes permiso para realizar este cambio.",
        );
      return operacion(con);
    });
  } catch (error) {
    const code = databaseErrorCode(error);
    if (code === "ER_DUP_ENTRY")
      throw new HttpError(
        409,
        "Ya existe ese nombre o combinación de color y talla.",
      );
    if (
      [
        "ER_LOCK_DEADLOCK",
        "ER_LOCK_WAIT_TIMEOUT",
        "ER_ROW_IS_REFERENCED_2",
      ].includes(code)
    )
      throw new HttpError(
        409,
        "No pudimos completar el cambio. Actualiza los datos e inténtalo de nuevo.",
      );
    throw error;
  }
}

async function slugUnico(con, nombre, id = 0) {
  const base =
    nombre
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 150) || "gorra";
  let slug = base,
    numero = 2;
  while (await repository.slugExiste(con, slug, id))
    slug = `${base}-${numero++}`;
  return slug;
}
async function ajustar(
  con,
  actorId,
  variante,
  cantidad,
  motivo,
  tipo = "ajuste",
) {
  const stock = variante.stock + cantidad;
  if (stock < 0 || stock > 2147483647)
    throw new HttpError(
      409,
      `El ajuste no es válido. Stock actual: ${variante.stock}.`,
      { stock: variante.stock },
    );
  if (cantidad) {
    await inventario.cambiarStock(con, variante.id, cantidad);
    await inventario.movimiento(con, {
      varianteId: variante.id,
      tipo,
      cantidad,
      stock,
      usuarioId: actorId,
      pedidoId: null,
      motivo: motivo || null,
    });
  }
  return { varianteId: variante.id, stock };
}
async function nuevaVariante(con, actorId, productoId, datos) {
  const id = await repository.crearVariante(
    con,
    productoId,
    datos,
    `VIS-${randomBytes(6).toString("hex")}`,
  );
  await ajustar(
    con,
    actorId,
    { id, stock: 0 },
    datos.stock || 0,
    "Inventario inicial",
    "entrada",
  );
  return id;
}
export const resumen = () => repository.resumen();
export async function productos(query) {
  const { rows, variantes } = await repository.productos(query.buscar);
  const grupos = new Map();
  for (const v of variantes) {
    if (!grupos.has(v.producto_id)) grupos.set(v.producto_id, []);
    grupos.get(v.producto_id).push(v);
  }
  return rows.map((p) => ({ ...p, variantes: grupos.get(p.id) || [] }));
}
export const crearProducto = (actor, datos) =>
  transaccion(actor, async (con) => {
    if (!(await repository.categoriaExiste(con, datos.categoria_id)))
      throw new HttpError(422, "Selecciona una categoría existente.");
    const id = await repository.crearProducto(
      con,
      datos,
      await slugUnico(con, datos.nombre),
    );
    for (const v of datos.variantes) await nuevaVariante(con, actor, id, v);
    return { id };
  });
export const editarProducto = (actor, id, datos) =>
  transaccion(actor, async (con) => {
    const p = await repository.bloquearProducto(con, id);
    if (!p) throw new HttpError(404, "No encontramos ese producto.");
    if (!(await repository.categoriaExiste(con, datos.categoria_id)))
      throw new HttpError(422, "Selecciona una categoría existente.");
    await repository.editarProducto(
      con,
      id,
      datos,
      p.nombre === datos.nombre
        ? p.slug
        : await slugUnico(con, datos.nombre, id),
    );
    return { id };
  });
export const borrarProducto = (actor, id) =>
  transaccion(actor, async (con) => {
    if (!(await repository.bloquearProducto(con, id)))
      throw new HttpError(404, "No encontramos ese producto.");
    const desactivado = Boolean(await repository.referenciasPedidos(con, id));
    await repository.borrarProducto(con, id, desactivado);
    return { desactivado };
  });
export const crearVariante = (actor, id, datos) =>
  transaccion(actor, async (con) => {
    if (!(await repository.bloquearProducto(con, id)))
      throw new HttpError(404, "No encontramos ese producto.");
    return { id: await nuevaVariante(con, actor, id, datos) };
  });
export const editarVariante = (actor, id, datos) =>
  transaccion(actor, async (con) => {
    const v = await repository.obtenerVariante(con, id, true);
    if (!v) throw new HttpError(404, "No encontramos esa variante.");
    await repository.editarVariante(con, id, datos);
    if (datos.stock !== undefined)
      await ajustar(
        con,
        actor,
        v,
        datos.stock - v.stock,
        "Edición de variante",
      );
    return { id };
  });
export const borrarVariante = (actor, id) =>
  transaccion(actor, async (con) => {
    if (!(await repository.obtenerVariante(con, id, true)))
      throw new HttpError(404, "No encontramos esa variante.");
    const desactivado = Boolean(
      await repository.referenciasPedidos(con, null, id),
    );
    await repository.borrarVariante(con, id, desactivado);
    return { desactivado };
  });
export async function inventarioActual(query) {
  return (await repository.inventario(query)).map((v) => ({
    ...v,
    estilo: estiloGorra(v.categoria_slug, v.slug),
  }));
}
export const ajustarInventario = (actor, datos) =>
  transaccion(actor, async (con) => {
    const v = await repository.obtenerVariante(con, datos.varianteId, true);
    if (!v) throw new HttpError(404, "No encontramos esa variante.");
    return ajustar(con, actor, v, datos.cantidad, datos.motivo);
  });
export const movimientos = () => repository.movimientos();
export const pedidos = (query) => repository.pedidos(query);
export const usuarios = (query) => repository.usuarios(query.buscar, false);
export const clientes = (query) => repository.usuarios(query.buscar, true);
export const editarUsuario = (actor, id, datos) =>
  transaccion(actor, async (con) => {
    if (actor === id && (datos.activo === false || datos.rol === "cliente"))
      throw new HttpError(
        409,
        "No puedes desactivar tu cuenta ni quitarte el rol de administrador.",
      );
    const u = await repository.usuario(con, id);
    if (!u) throw new HttpError(404, "No encontramos ese usuario.");
    await repository.editarUsuario(con, id, {
      rol: datos.rol ?? u.rol,
      activo: datos.activo ?? Boolean(u.activo),
    });
    return { id };
  });
