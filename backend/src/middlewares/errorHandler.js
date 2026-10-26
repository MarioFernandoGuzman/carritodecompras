import { HttpError } from '../utils/HttpError.js';

export function errorHandler(error, _req, res, _next) {
  const status = error instanceof HttpError ? error.status : error.type === 'entity.parse.failed' ? 400
    : error.type === 'entity.too.large' ? 413 : 500;

  if (status === 500) console.error({ nombre: error.name, codigo: error.code || 'ERROR_INTERNO' });

  res.status(status).json({
    ok: false,
    error: {
      mensaje: error instanceof HttpError ? error.message : status === 500 ? 'Ocurrió un error en el servidor.' : 'Solicitud inválida.',
      ...(error instanceof HttpError && error.detalles ? { detalles: error.detalles } : {}),
    },
  });
}
