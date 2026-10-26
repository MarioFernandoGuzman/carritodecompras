import * as authService from '../services/auth.service.js';
import { COOKIE_SESION, cookieOptions } from '../config/sesion.js';

function responderSesion(res, usuario, status = 200) {
  res.cookie(COOKIE_SESION, authService.firmarSesion(usuario), { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
  res.status(status).json({ ok: true, data: { usuario } });
}

export async function registro(req, res) {
  responderSesion(res, await authService.registrar(req.validated.body), 201);
}

export async function login(req, res) {
  responderSesion(res, await authService.ingresar(req.validated.body));
}

export function logout(_req, res) {
  res.clearCookie(COOKIE_SESION, cookieOptions);
  res.json({ ok: true, data: null });
}

export function yo(req, res) {
  res.json({ ok: true, data: { usuario: req.usuario } });
}
