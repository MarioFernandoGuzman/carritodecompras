const baseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(mensaje, status = 0, detalles = []) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

export async function solicitar(ruta, { body, headers, ...opciones } = {}) {
  let response;
  try {
    response = await fetch(`${baseUrl}${ruta}`, {
      ...opciones,
      credentials: 'include',
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('No pudimos conectar con el servidor. Inténtalo de nuevo.');
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok !== true) {
    throw new ApiError(payload?.error?.mensaje || 'No pudimos completar la solicitud.', response.status, payload?.error?.detalles);
  }
  return payload.data;
}
