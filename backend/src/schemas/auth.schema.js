import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email({ error: 'Ingresa un correo válido.' }).max(150));
const password = z.string().min(8, 'Usa al menos 8 caracteres.').refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Usa como máximo 72 bytes en la contraseña.');

export const registroSchema = z.object({
  nombre: z.string().trim().min(1, 'Ingresa tu nombre.').max(100),
  email,
  password: password.regex(/\p{L}/u, 'Incluye una letra.').regex(/[0-9]/, 'Incluye un número.'),
  telefono: z.string().trim().max(20).optional().transform((value) => value || null),
}).strict();

export const loginSchema = z.object({ email, password: z.string().min(1).max(256) }).strict();
export const vacioSchema = z.object({}).strict().default({});
