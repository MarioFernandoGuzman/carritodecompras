import { Router } from 'express';
import * as controller from '../controllers/adminGestion.controller.js';
import * as schema from '../schemas/adminGestion.schema.js';
import { vacioSchema } from '../schemas/auth.schema.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import { requireRole } from '../middlewares/requireRole.js';
import { validate } from '../middlewares/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const adminRouter=Router();
const validar=(body=vacioSchema,params=vacioSchema,query=vacioSchema)=>validate({body,params,query});
adminRouter.use(requireAuth,requireRole('admin'),(_req,res,next)=>{res.set('Cache-Control','no-store');next();});
for(const [ruta,recurso] of [['resumen','resumen'],['productos','productos'],['inventario','inventarioActual'],['inventario/movimientos','movimientos'],['pedidos','pedidos'],['usuarios','usuarios'],['clientes','clientes']]){
  adminRouter.get(`/${ruta}`,validar(vacioSchema,vacioSchema,schema.adminQuery),asyncHandler(controller.leer(recurso)));
}
adminRouter.post('/productos',validar(schema.crearProductoAdmin),asyncHandler(controller.crear('crearProducto')));
adminRouter.put('/productos/:id',validar(schema.editarProductoAdmin,schema.adminParams),asyncHandler(controller.cambiar('editarProducto')));
adminRouter.delete('/productos/:id',validar(vacioSchema,schema.adminParams),asyncHandler(controller.cambiar('borrarProducto')));
adminRouter.post('/productos/:id/variantes',validar(schema.varianteAdmin,schema.adminParams),asyncHandler(controller.variante));
adminRouter.put('/variantes/:id',validar(schema.varianteAdmin,schema.adminParams),asyncHandler(controller.cambiar('editarVariante')));
adminRouter.delete('/variantes/:id',validar(vacioSchema,schema.adminParams),asyncHandler(controller.cambiar('borrarVariante')));
adminRouter.post('/inventario/ajuste',validar(schema.ajusteAdmin),asyncHandler(controller.ajuste));
adminRouter.get('/pedidos/:id',validar(vacioSchema,schema.adminParams),asyncHandler(controller.pedido));
adminRouter.patch('/pedidos/:id/estado',validar(schema.estadoAdmin,schema.adminParams),asyncHandler(controller.estado));
adminRouter.patch('/usuarios/:id',validar(schema.usuarioAdmin,schema.adminParams),asyncHandler(controller.cambiar('editarUsuario')));
