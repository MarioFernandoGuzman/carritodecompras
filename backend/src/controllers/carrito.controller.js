import * as service from '../services/carrito.service.js';
import { configuracionEnvio } from '../config/envio.js';

export function configuracion(_req, res) { res.json({ ok: true, data: configuracionEnvio() }); }
export async function obtener(req, res) { res.json({ ok: true, data: await service.obtenerCarrito(req.usuario.id) }); }
export async function agregar(req, res) { res.status(201).json({ ok: true, data: await service.agregarItem(req.usuario.id, req.validated.body) }); }
export async function modificar(req, res) { res.json({ ok: true, data: await service.modificarItem(req.usuario.id, req.validated.params.id, req.validated.body.cantidad) }); }
export async function eliminar(req, res) { res.json({ ok: true, data: await service.eliminarItem(req.usuario.id, req.validated.params.id) }); }
export async function vaciar(req, res) { res.json({ ok: true, data: await service.vaciarCarrito(req.usuario.id) }); }
export async function fusionar(req, res) { res.json({ ok: true, data: await service.fusionarCarrito(req.usuario.id, req.validated.body.items) }); }
