import { HttpError } from '../utils/HttpError.js';

export const requireRole = (rol) => (req, _res, next) => {
  if (!req.usuario) return next(new HttpError(401, 'Inicia sesión para continuar.'));
  if (req.usuario.rol !== rol) return next(new HttpError(403, 'No tienes permiso para acceder.'));
  next();
};
