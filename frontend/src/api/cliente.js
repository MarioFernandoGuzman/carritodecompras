const baseUrl = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(mensaje, status = 0, detalles = []) {
    super(mensaje);
    this.status = status;
    this.detalles = detalles;
  }
}

export async function solicitar(ruta, { body, headers, ...opciones } = {}) {
  const notificar=(mensaje,tipo)=>{
    if(typeof window!=='undefined'&&opciones.method&&opciones.method!=='GET'&&!ruta.startsWith('/carrito'))window.dispatchEvent(new CustomEvent('visera:aviso',{detail:{mensaje,tipo}}));
  };
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
    const mensaje='No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.';
    notificar(mensaje,'error');throw new ApiError(mensaje);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.ok !== true) {
    if(typeof window!=='undefined'&&[401,403].includes(response.status)&&!ruta.startsWith('/auth'))window.dispatchEvent(new Event('visera:sesion'));
    const mensaje=payload?.error?.mensaje || 'No pudimos completar la solicitud.';
    notificar(mensaje,'error');throw new ApiError(mensaje,response.status,payload?.error?.detalles);
  }
  notificar(ruta==='/auth/login'?'Sesión iniciada.':ruta==='/auth/logout'?'Sesión cerrada.':ruta==='/auth/registro'?'Tu cuenta está lista.':'Cambios guardados correctamente.','exito');
  return payload.data;
}
