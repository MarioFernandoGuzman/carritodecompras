import { rateLimit } from 'express-rate-limit';

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { ok: false, error: { mensaje: 'Demasiados intentos. Inténtalo de nuevo en unos minutos.' } },
});
