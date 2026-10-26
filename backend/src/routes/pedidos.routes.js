import { Router } from 'express';
import * as controller from '../controllers/pedidos.controller.js';
import { pedidoSchema, pedidoParams } from '../schemas/pedidos.schema.js';
import { vacioSchema } from '../schemas/auth.schema.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { requireRole } from '../middlewares/requireRole.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const pedidosRouter = Router();
const validar = (body = vacioSchema, params = vacioSchema) => validate({ body, params, query: vacioSchema });
pedidosRouter.use(requireAuth, requireRole('cliente'), (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
pedidosRouter.post('/', validar(pedidoSchema), asyncHandler(controller.crear));
pedidosRouter.get('/', validar(), asyncHandler(controller.listar));
pedidosRouter.get('/:id', validar(vacioSchema, pedidoParams), asyncHandler(controller.obtener));
pedidosRouter.post('/:id/cancelar', validar(vacioSchema, pedidoParams), asyncHandler(controller.cancelar));
