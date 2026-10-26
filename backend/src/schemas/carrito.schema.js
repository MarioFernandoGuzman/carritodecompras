import { z } from 'zod';

const id = z.number().int().positive().max(4294967295);
const cantidad = z.number().int().min(1).max(2147483647);
export const itemSchema = z.object({ varianteId: id, cantidad }).strict();
export const cantidadSchema = z.object({ cantidad }).strict();
export const itemParams = z.object({ id: z.string().regex(/^[1-9]\d{0,9}$/).transform(Number).pipe(id) }).strict();
export const fusionSchema = z.object({ items: z.array(itemSchema).max(100) }).strict();
