import { z } from 'zod';

export const pedidoSchema = z.object({
  nombre_destinatario: z.string().trim().min(1, 'Ingresa el nombre del destinatario.').max(100),
  telefono_contacto: z.string().trim().regex(/^[+0-9()\s-]{7,20}$/, 'Ingresa un teléfono válido.'),
  direccion_envio: z.string().trim().min(5, 'Escribe una dirección completa.').max(255),
  ciudad: z.string().trim().min(2, 'Ingresa tu ciudad.').max(80),
  notas: z.string().trim().max(255).optional().transform((value) => value || null),
  metodo_pago: z.enum(['tarjeta', 'contra_entrega']),
  pago_marca: z.enum(['visa', 'mastercard']).nullable().optional(),
  pago_ultimos4: z.string().regex(/^\d{4}$/).nullable().optional(),
}).strict().superRefine((datos, ctx) => {
  if (datos.metodo_pago === 'tarjeta' && (!datos.pago_marca || !datos.pago_ultimos4)) {
    ctx.addIssue({ code: 'custom', message: 'Completa los datos de pago de demostración.', path: ['metodo_pago'] });
  }
  if (datos.metodo_pago === 'contra_entrega' && (datos.pago_marca || datos.pago_ultimos4)) {
    ctx.addIssue({ code: 'custom', message: 'El pago contra entrega no requiere datos de tarjeta.', path: ['metodo_pago'] });
  }
});

export const pedidoParams = z.object({ id: z.string().regex(/^[1-9]\d{0,9}$/).transform(Number).pipe(z.number().int().max(4294967295)) }).strict();
