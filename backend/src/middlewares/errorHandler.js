export function errorHandler(error, _req, res, _next) {
  const status = error.type === 'entity.parse.failed' ? 400
    : error.type === 'entity.too.large' ? 413 : 500;

  if (status === 500) console.error(error);

  res.status(status).json({
    ok: false,
    error: { mensaje: status === 500 ? 'Ocurrió un error en el servidor.' : 'Solicitud inválida.' },
  });
}
