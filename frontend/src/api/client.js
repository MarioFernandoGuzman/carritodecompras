import { solicitar } from './cliente.js';

export async function obtenerSalud(signal) {
  await solicitar('/salud', { signal });
  return { ok: true };
}
