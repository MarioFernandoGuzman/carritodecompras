import { z } from 'zod';

export const adminSchema = z.object({
  ADMIN_EMAIL: z.string().trim().toLowerCase().pipe(z.email().max(150)),
  ADMIN_PASSWORD: z.string().min(12).refine((value) => Buffer.byteLength(value, 'utf8') <= 72, {
    message: 'La contraseña no puede superar 72 bytes.',
  }),
  ADMIN_NOMBRE: z.string().trim().min(1).max(100),
}).transform((values) => ({
  email: values.ADMIN_EMAIL,
  password: values.ADMIN_PASSWORD,
  nombre: values.ADMIN_NOMBRE,
}));
