import { sequelize } from "../config/db.js";
import {
  TARIFA_ENVIO_CENTAVOS,
  ENVIO_GRATIS_DESDE_CENTAVOS,
} from "../config/envio.js";
import * as repository from "../repositories/carrito.repository.js";
import { HttpError } from "../utils/HttpError.js";
import { estiloGorra } from "../utils/estiloGorra.js";

const dinero = (centavos) => (centavos / 100).toFixed(2);

async function transaccion(usuarioId, operacion) {
  return sequelize.transaction(async (connection) => {
    await repository.bloquearUsuario(connection, usuarioId);
    let carritoId = await repository.buscarCarrito(connection, usuarioId);
    const contexto = {
      connection,
      carritoId,
      asegurar: async () => {
        if (!carritoId)
          carritoId = await repository.crearCarrito(connection, usuarioId);
        contexto.carritoId = carritoId;
        return carritoId;
      },
    };
    const avisos = (await operacion(contexto)) || [];
    return resumir(connection, carritoId, avisos);
  });
}

async function resumir(connection, carritoId, avisos = []) {
  const rows = carritoId
    ? await repository.leerItems(connection, carritoId)
    : [];
  const items = [];
  let subtotal = 0;
  let ajustado = false;
  for (const row of rows) {
    const cantidad =
      row.activo && row.producto_activo ? Math.min(row.cantidad, row.stock) : 0;
    if (cantidad !== row.cantidad) {
      ajustado = true;
      avisos.push(
        `${row.nombre}: ajustamos la cantidad de ${row.cantidad} a ${cantidad} por disponibilidad.`,
      );
      if (cantidad)
        await repository.guardarItem(
          connection,
          carritoId,
          row.varianteId,
          cantidad,
        );
      else await repository.eliminarItem(connection, carritoId, row.id);
    }
    if (!cantidad) continue;
    const centavos = Math.round(Number(row.precio_unitario) * 100) * cantidad;
    if (
      !Number.isSafeInteger(centavos) ||
      !Number.isSafeInteger(subtotal + centavos)
    )
      throw new HttpError(
        422,
        "El importe del carrito supera el límite permitido.",
      );
    subtotal += centavos;
    const { activo, producto_activo, categoria_slug, ...item } = row;
    items.push({
      ...item,
      cantidad,
      estilo: estiloGorra(categoria_slug, row.slug),
      subtotal: dinero(centavos),
    });
  }
  if (ajustado) await repository.actualizarFecha(connection, carritoId);
  const envio =
    !items.length || subtotal >= ENVIO_GRATIS_DESDE_CENTAVOS
      ? 0
      : TARIFA_ENVIO_CENTAVOS;
  return {
    items,
    subtotal: dinero(subtotal),
    envio: dinero(envio),
    total: dinero(subtotal + envio),
    falta_envio_gratis: dinero(
      Math.max(0, ENVIO_GRATIS_DESDE_CENTAVOS - subtotal),
    ),
    avisos,
  };
}

function comprobarStock(variante, cantidad) {
  const stock =
    variante?.activo && variante.producto_activo ? variante.stock : 0;
  if (!stock || cantidad > stock)
    throw new HttpError(
      409,
      `Solo hay ${stock} unidades disponibles de esta variante.`,
      { stock },
    );
}

export const obtenerCarrito = (usuarioId) =>
  transaccion(usuarioId, async () => {});

export const agregarItem = (usuarioId, datos) =>
  transaccion(usuarioId, async (ctx) => {
    const variante = await repository.buscarVariante(
      ctx.connection,
      datos.varianteId,
    );
    comprobarStock(variante, datos.cantidad);
    const id = await ctx.asegurar();
    const cantidad =
      (await repository.cantidadDeVariante(
        ctx.connection,
        id,
        datos.varianteId,
      )) + datos.cantidad;
    comprobarStock(variante, cantidad);
    await repository.guardarItem(
      ctx.connection,
      id,
      datos.varianteId,
      cantidad,
    );
    await repository.actualizarFecha(ctx.connection, id);
  });

export const modificarItem = (usuarioId, itemId, cantidad) =>
  transaccion(usuarioId, async (ctx) => {
    const item =
      ctx.carritoId &&
      (await repository.buscarItem(ctx.connection, ctx.carritoId, itemId));
    if (!item)
      throw new HttpError(404, "No encontramos ese artículo en tu carrito.");
    comprobarStock(
      await repository.buscarVariante(ctx.connection, item.varianteId),
      cantidad,
    );
    await repository.guardarItem(
      ctx.connection,
      ctx.carritoId,
      item.varianteId,
      cantidad,
    );
    await repository.actualizarFecha(ctx.connection, ctx.carritoId);
  });

export const eliminarItem = (usuarioId, itemId) =>
  transaccion(usuarioId, async (ctx) => {
    const item =
      ctx.carritoId &&
      (await repository.buscarItem(ctx.connection, ctx.carritoId, itemId));
    if (!item)
      throw new HttpError(404, "No encontramos ese artículo en tu carrito.");
    await repository.eliminarItem(ctx.connection, ctx.carritoId, itemId);
    await repository.actualizarFecha(ctx.connection, ctx.carritoId);
  });

export const vaciarCarrito = (usuarioId) =>
  transaccion(usuarioId, async (ctx) => {
    if (ctx.carritoId) {
      await repository.vaciar(ctx.connection, ctx.carritoId);
      await repository.actualizarFecha(ctx.connection, ctx.carritoId);
    }
  });

export const fusionarCarrito = (usuarioId, items) =>
  transaccion(usuarioId, async (ctx) => {
    const agrupados = new Map();
    for (const item of items)
      agrupados.set(
        item.varianteId,
        (agrupados.get(item.varianteId) || 0) + item.cantidad,
      );
    const avisos = [];
    for (const [varianteId, solicitadas] of [...agrupados].sort(
      ([a], [b]) => a - b,
    )) {
      const variante = await repository.buscarVariante(
        ctx.connection,
        varianteId,
      );
      if (!variante?.activo || !variante.producto_activo || !variante.stock) {
        avisos.push("Omitimos una variante que ya no está disponible.");
        continue;
      }
      const id = await ctx.asegurar();
      const existente = await repository.cantidadDeVariante(
        ctx.connection,
        id,
        varianteId,
      );
      const cantidad = Math.min(existente + solicitadas, variante.stock);
      if (cantidad < existente + solicitadas)
        avisos.push(
          `Ajustamos una variante al stock disponible: ${variante.stock} unidades.`,
        );
      await repository.guardarItem(ctx.connection, id, varianteId, cantidad);
      await repository.actualizarFecha(ctx.connection, id);
    }
    return avisos;
  });
