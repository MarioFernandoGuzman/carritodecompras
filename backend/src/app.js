import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { saludRouter } from './routes/salud.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());
app.use('/api/salud', saludRouter);
app.use((_req, res) => {
  res.status(404).json({ ok: false, error: { mensaje: 'Ruta no encontrada.' } });
});
app.use(errorHandler);
