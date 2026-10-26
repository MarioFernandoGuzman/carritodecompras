import { Router } from 'express';
import * as controller from '../controllers/carrito.controller.js';
import { itemSchema, cantidadSchema, itemParams, fusionSchema } from '../schemas/carrito.schema.js';
import { vacioSchema } from '../schemas/auth.schema.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { requireRole } from '../middlewares/requireRole.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const carritoRouter = Router();
const validar = (body = vacioSchema, params = vacioSchema) => validate({ body, params, query: vacioSchema });
carritoRouter.get('/configuracion', validar(), asyncHandler(controller.configuracion));
carritoRouter.use(requireAuth, requireRole('cliente'), (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
carritoRouter.get('/', validar(), asyncHandler(controller.obtener));
carritoRouter.post('/items', validar(itemSchema), asyncHandler(controller.agregar));
carritoRouter.patch('/items/:id', validar(cantidadSchema, itemParams), asyncHandler(controller.modificar));
carritoRouter.delete('/items/:id', validar(vacioSchema, itemParams), asyncHandler(controller.eliminar));
carritoRouter.delete('/', validar(), asyncHandler(controller.vaciar));
carritoRouter.post('/fusionar', validar(fusionSchema), asyncHandler(controller.fusionar));
