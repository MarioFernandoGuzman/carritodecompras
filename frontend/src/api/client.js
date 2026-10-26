const apiUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api').replace(/\/$/, '');

export async function obtenerSalud(signal) {
  const response = await fetch(`${apiUrl}/salud`, { credentials: 'include', signal });
  if (!response.ok) throw new Error('No se pudo contactar con el servidor.');
  const data = await response.json();
  if (data.ok !== true) throw new Error('Respuesta inesperada del servidor.');
  return data;
}
