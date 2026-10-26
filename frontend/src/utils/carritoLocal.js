import { solicitar } from '../api/cliente.js';

const CLAVE = 'visera.carrito.v1';
export const snapshot = (items) => items.map(({ varianteId, cantidad, slug }) => ({ varianteId, cantidad, slug }));

export function leerLocal() {
  try {
    const raw = JSON.parse(localStorage.getItem(CLAVE) || '[]');
    if (!Array.isArray(raw)) return [];
    const unicos = new Map();
    for (const item of raw.slice(0, 100)) {
      if (!Number.isInteger(item?.varianteId) || item.varianteId < 1 || item.varianteId > 4294967295 || !Number.isInteger(item.cantidad) || item.cantidad < 1
        || item.cantidad > 2147483647 || typeof item.slug !== 'string' || item.slug.length > 180 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) continue;
      unicos.set(item.varianteId, { varianteId: item.varianteId, cantidad: item.cantidad, slug: item.slug });
    }
    return [...unicos.values()];
  } catch { return []; }
}

export function guardarLocal(items) {
  try {
    if (items.length) localStorage.setItem(CLAVE, JSON.stringify(snapshot(items)));
    else localStorage.removeItem(CLAVE);
    return true;
  }
  catch { return false; }
}

export function crearItem(producto, variante, cantidad) {
  return { varianteId: variante.id, nombre: producto.nombre, slug: producto.slug, color_nombre: variante.color_nombre,
    color_hex: variante.color_hex, talla: variante.talla, estilo: producto.estilo, precio_unitario: producto.precio,
    cantidad, stock: variante.stock };
}

export async function refrescarLocal(items) {
  const productos = new Map(await Promise.all([...new Set(items.map((i) => i.slug))].map(async (slug) => {
    try { return [slug, await solicitar(`/productos/${encodeURIComponent(slug)}`)]; }
    catch (error) { if (error.status === 404) return [slug, null]; throw error; }
  })));
  const avisos = [];
  const actualizados = [];
  for (const item of items) {
    const producto = productos.get(item.slug);
    const variante = producto?.variantes.find((v) => v.id === item.varianteId);
    const cantidad = Math.min(item.cantidad, variante?.stock || 0);
    if (cantidad !== item.cantidad) avisos.push(`${producto?.nombre || 'Una gorra'}: ajustamos la cantidad de ${item.cantidad} a ${cantidad} por disponibilidad.`);
    if (cantidad) actualizados.push(crearItem(producto, variante, cantidad));
  }
  return { items: actualizados, avisos };
}
