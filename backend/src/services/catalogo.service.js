import * as repository from '../repositories/catalogo.repository.js';
import { HttpError } from '../utils/HttpError.js';
import { estiloGorra } from '../utils/estiloGorra.js';

function productoPublico(row) {
  return {
    id: row.id, nombre: row.nombre, slug: row.slug, precio: row.precio, destacado: Boolean(row.destacado),
    categoria: { id: row.categoria_id, nombre: row.categoria_nombre, slug: row.categoria_slug },
    estilo: estiloGorra(row.categoria_slug, row.slug),
  };
}

export const obtenerCategorias = () => repository.listarCategorias();

export async function obtenerProductos(query) {
  const { rows, total } = await repository.listarProductos(query);
  const colores = await repository.coloresDeProductos(rows.map((row) => row.id));
  const porProducto = new Map();
  for (const { producto_id, disponible, ...color } of colores) {
    if (!porProducto.has(producto_id)) porProducto.set(producto_id, []);
    porProducto.get(producto_id).push({ ...color, disponible: Boolean(disponible) });
  }
  return {
    productos: rows.map((row) => ({ ...productoPublico(row), agotado: Boolean(row.agotado), colores: porProducto.get(row.id) || [] })),
    paginacion: { pagina: query.pagina, limite: query.limite, total, paginas: Math.ceil(total / query.limite) },
  };
}

export async function obtenerProducto(slug) {
  const row = await repository.buscarProducto(slug);
  if (!row) throw new HttpError(404, 'No encontramos esa gorra.');
  const variantes = await repository.variantesDeProducto(row.id);
  return { ...productoPublico(row), descripcion: row.descripcion, material: row.material, variantes, agotado: variantes.every((v) => v.stock === 0) };
}
