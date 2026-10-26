import { Router } from 'express';
import * as controller from '../controllers/catalogo.controller.js';
import { productosQuery, productoParams } from '../schemas/catalogo.schema.js';
import { vacioSchema } from '../schemas/auth.schema.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const catalogoRouter = Router();
catalogoRouter.get('/categorias', validate({ query: vacioSchema, params: vacioSchema }), asyncHandler(controller.categorias));
catalogoRouter.get('/productos', validate({ query: productosQuery, params: vacioSchema }), asyncHandler(controller.productos));
catalogoRouter.get('/productos/:slug', validate({ query: vacioSchema, params: productoParams }), asyncHandler(controller.producto));
