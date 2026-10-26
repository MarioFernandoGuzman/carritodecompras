import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { registroSchema, loginSchema, vacioSchema } from '../schemas/auth.schema.js';
import { validate } from '../middlewares/validate.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter = Router();
authRouter.use((_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
const validar = (body) => validate({ body, params: vacioSchema, query: vacioSchema });

authRouter.post('/registro', validar(registroSchema), asyncHandler(authController.registro));
authRouter.post('/login', validar(loginSchema), asyncHandler(authController.login));
authRouter.post('/logout', validar(vacioSchema), asyncHandler(authController.logout));
authRouter.get('/yo', validar(vacioSchema), requireAuth, asyncHandler(authController.yo));
