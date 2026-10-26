import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { COOKIE_SESION } from '../config/sesion.js';
import { buscarPorId } from '../repositories/usuarios.repository.js';
import { usuarioPublico } from '../services/auth.service.js';
import { HttpError } from '../utils/HttpError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  let payload;
  try {
    payload = jwt.verify(req.cookies?.[COOKIE_SESION], env.JWT_SECRET, {
      algorithms: ['HS256'], issuer: 'visera-api', audience: 'visera-web',
    });
    if (!/^\d+$/.test(payload.sub)) throw new Error('Sujeto inválido.');
  } catch {
    throw new HttpError(401, 'Inicia sesión para continuar.');
  }
  const usuario = await buscarPorId(payload.sub);
  if (!usuario?.activo) throw new HttpError(401, 'Inicia sesión para continuar.');
  req.usuario = usuarioPublico(usuario);
  next();
});
