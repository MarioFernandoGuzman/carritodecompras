import { z } from 'zod';
import { HttpError } from '../utils/HttpError.js';

z.config(z.locales.es());

export const validate = (schemas) => (req, _res, next) => {
  req.validated = {};
  for (const [source, schema] of Object.entries(schemas)) {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new HttpError(422, 'Revisa los datos enviados.', result.error.issues.map((issue) => ({
        campo: [source, ...issue.path].join('.'), mensaje: issue.message,
      }))));
    }
    req.validated[source] = result.data;
  }
  next();
};
