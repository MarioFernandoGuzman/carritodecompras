import { z } from 'zod';

const texto = (max) => z.string().trim().min(1).max(max).optional();
const importe = z.string().regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/, 'Usa un importe positivo con hasta dos decimales.').transform(Number).optional();
const entero = (max, defecto) => z.string().regex(/^[1-9]\d{0,6}$/).transform(Number).pipe(z.number().max(max)).default(defecto);

export const productosQuery = z.object({
  categoria: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100).optional(),
  buscar: texto(100),
  color: texto(40),
  talla: texto(20),
  min: importe,
  max: importe,
  orden: z.enum(['precio_asc', 'precio_desc', 'nuevos', 'destacados']).default('destacados'),
  pagina: entero(1000000, 1),
  limite: entero(48, 12),
}).strict().refine((query) => query.min === undefined || query.max === undefined || query.min <= query.max, {
  message: 'El precio mínimo no puede superar al máximo.', path: ['min'],
});

export const productoParams = z.object({ slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180) }).strict();
