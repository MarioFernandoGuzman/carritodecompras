import * as service from '../services/pedidos.service.js';

export async function crear(req, res) { res.status(201).json({ ok: true, data: await service.crearPedido(req.usuario.id, req.validated.body) }); }
export async function listar(req, res) { res.json({ ok: true, data: await service.listarPedidos(req.usuario.id) }); }
export async function obtener(req, res) { res.json({ ok: true, data: await service.obtenerPedido(req.usuario.id, req.validated.params.id) }); }
export async function cancelar(req, res) { res.json({ ok: true, data: await service.cancelarPedido(req.usuario.id, req.validated.params.id) }); }
