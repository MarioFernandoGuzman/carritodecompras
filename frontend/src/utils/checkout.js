export function validarDatos(datos) {
  const errores = {};
  if (!datos.nombre_destinatario.trim() || datos.nombre_destinatario.trim().length > 100) errores.nombre_destinatario = 'Ingresa el nombre del destinatario (máximo 100 caracteres).';
  if (!/^[+0-9()\s-]{7,20}$/.test(datos.telefono_contacto.trim())) errores.telefono_contacto = 'Ingresa un teléfono válido.';
  if (datos.direccion_envio.trim().length < 5 || datos.direccion_envio.length > 255) errores.direccion_envio = 'Escribe una dirección completa (5–255 caracteres).';
  if (datos.ciudad.trim().length < 2 || datos.ciudad.length > 80) errores.ciudad = 'Ingresa tu ciudad (2–80 caracteres).';
  if (datos.notas.length > 255) errores.notas = 'Usa como máximo 255 caracteres.';
  return errores;
}

export function marcaTarjeta(numero) {
  const limpio = numero.replace(/\D/g, '');
  if (/^4\d{12}(?:\d{3})?(?:\d{3})?$/.test(limpio)) return 'visa';
  const inicio = Number(limpio.slice(0, 4));
  if (limpio.length === 16 && (/^5[1-5]/.test(limpio) || (inicio >= 2221 && inicio <= 2720))) return 'mastercard';
  return null;
}

export function validarTarjeta(numero, fecha) {
  const limpio = numero.replace(/\D/g, '');
  let suma = 0;
  let duplicar = false;
  for (let i = limpio.length - 1; i >= 0; i--) {
    let digito = Number(limpio[i]);
    if (duplicar) { digito *= 2; if (digito > 9) digito -= 9; }
    suma += digito; duplicar = !duplicar;
  }
  const errores = {};
  if (!marcaTarjeta(limpio) || suma % 10 !== 0) errores.numero = 'Ingresa una Visa o Mastercard válida para la demostración.';
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(fecha);
  const hoy = new Date();
  if (!match || Number(match[2]) + 2000 < hoy.getFullYear()
    || (Number(match[2]) + 2000 === hoy.getFullYear() && Number(match[1]) < hoy.getMonth() + 1)) errores.fecha = 'Usa una fecha vigente en formato MM/AA.';
  return errores;
}

export const estadosPedido = { pendiente: 'Pendiente', pagado: 'Pagado', enviado: 'Enviado', entregado: 'Entregado', cancelado: 'Cancelado' };
export const fechaPedido = (valor) => new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(valor));
