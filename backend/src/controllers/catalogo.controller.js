import * as service from '../services/catalogo.service.js';

export async function categorias(_req, res) {
  res.json({ ok: true, data: await service.obtenerCategorias() });
}

export async function productos(req, res) {
  res.json({ ok: true, data: await service.obtenerProductos(req.validated.query) });
}

export async function producto(req, res) {
  res.json({ ok: true, data: await service.obtenerProducto(req.validated.params.slug) });
}
