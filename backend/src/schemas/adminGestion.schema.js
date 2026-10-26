import { z } from 'zod';

const id = z.number().int().positive().max(4294967295);
const stock = z.number().int().min(0).max(2147483647);
export const adminParams = z.object({ id: z.string().regex(/^[1-9]\d{0,9}$/).transform(Number).pipe(id) }).strict();
export const adminQuery = z.object({ buscar: z.string().trim().max(100).optional(), bajo: z.enum(['0', '1']).optional(), agotado: z.enum(['0', '1']).optional(), estado: z.enum(['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado']).optional(), usuario: z.string().regex(/^[1-9]\d{0,9}$/).transform(Number).pipe(id).optional() }).strict();
export const varianteAdmin = z.object({ color_nombre: z.string().trim().min(1).max(40), color_hex: z.string().regex(/^#[0-9a-fA-F]{6}$/), talla: z.string().trim().min(1).max(20), stock: stock.optional(), stock_minimo: stock.default(3), activo: z.boolean().default(true) }).strict();
const producto = { nombre: z.string().trim().min(1).max(150), categoria_id: id, descripcion: z.string().trim().max(5000).default(''), material: z.string().trim().max(100).default(''), precio: z.number().finite().min(0).max(99999999.99).refine((v) => Math.abs(Math.round(v * 100) - v * 100) < .00001, 'Usa hasta dos decimales.'), destacado: z.boolean().default(false), activo: z.boolean().default(true) };
export const crearProductoAdmin = z.object({ ...producto, variantes: z.array(varianteAdmin).min(1).max(100) }).strict();
export const editarProductoAdmin = z.object(producto).strict();
export const ajusteAdmin = z.object({ varianteId: id, cantidad: z.number().int().min(-2147483647).max(2147483647).refine((v) => v !== 0, 'El ajuste debe ser distinto de cero.'), motivo: z.string().trim().max(255).default('') }).strict();
export const estadoAdmin = z.object({ estado: z.enum(['pagado', 'enviado', 'entregado', 'cancelado']) }).strict();
export const usuarioAdmin = z.object({ activo: z.boolean().optional(), rol: z.enum(['cliente', 'admin']).optional() }).strict().refine((v) => Object.keys(v).length > 0, 'Indica un cambio.');
