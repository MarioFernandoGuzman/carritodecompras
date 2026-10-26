import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { saludRouter } from './routes/salud.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { authRouter } from './routes/auth.routes.js';
import { authRateLimit } from './middlewares/rateLimit.js';
import { catalogoRouter } from './routes/catalogo.routes.js';
import { carritoRouter } from './routes/carrito.routes.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());
app.use('/api/salud', saludRouter);
app.use('/api/auth', authRateLimit, authRouter);
app.use('/api', catalogoRouter);
app.use('/api/carrito', carritoRouter);
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: { mensaje: 'Ruta no encontrada.' } });
});
app.use(errorHandler);
