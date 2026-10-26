import { Router } from 'express';
import { obtenerSalud } from '../controllers/salud.controller.js';

export const saludRouter = Router();
saludRouter.get('/', obtenerSalud);
