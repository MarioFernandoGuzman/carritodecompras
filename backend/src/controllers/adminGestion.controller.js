import * as service from '../services/adminGestion.service.js';
import * as pedidos from '../services/pedidos.service.js';

export const leer = (recurso) => async (req,res) => res.json({ok:true,data:await service[recurso](req.validated.query)});
export const crear = (recurso) => async (req,res) => res.status(201).json({ok:true,data:await service[recurso](req.usuario.id,req.validated.body)});
export const cambiar = (recurso) => async (req,res) => res.json({ok:true,data:await service[recurso](req.usuario.id,req.validated.params.id,req.validated.body)});
export async function ajuste(req,res){res.json({ok:true,data:await service.ajustarInventario(req.usuario.id,req.validated.body)});}
export async function variante(req,res){res.status(201).json({ok:true,data:await service.crearVariante(req.usuario.id,req.validated.params.id,req.validated.body)});}
export async function pedido(req,res){res.json({ok:true,data:await pedidos.obtenerPedidoAdmin(req.validated.params.id)});}
export async function estado(req,res){res.json({ok:true,data:await pedidos.cambiarEstadoAdmin(req.usuario.id,req.validated.params.id,req.validated.body.estado)});}
