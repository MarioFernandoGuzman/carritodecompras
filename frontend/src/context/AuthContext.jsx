import { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { solicitar } from '../api/cliente.js';

const AuthContext = createContext(null);
const inicial = { usuario: null, cargando: true, errorSesion: '' };

function authReducer(_state, action) {
  if (action.type === 'cargando') return { ...inicial };
  if (action.type === 'sesion') return { usuario: action.usuario, cargando: false, errorSesion: '' };
  return { usuario: null, cargando: false, errorSesion: action.error };
}

export function AuthProvider({ children }) {
  const [estado, dispatch] = useReducer(authReducer, inicial);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: 'cargando' });
    solicitar('/auth/yo', { signal: controller.signal })
      .then(({ usuario }) => dispatch({ type: 'sesion', usuario }))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          dispatch(error.status === 401 ? { type: 'sesion', usuario: null } : { type: 'error', error: error.message });
        }
      });
    return () => controller.abort();
  }, [intento]);

  async function autenticar(ruta, datos) {
    const { usuario } = await solicitar(ruta, { method: 'POST', body: datos });
    dispatch({ type: 'sesion', usuario });
    return usuario;
  }

  async function salir() {
    await solicitar('/auth/logout', { method: 'POST', body: {} });
    dispatch({ type: 'sesion', usuario: null });
  }

  return <AuthContext.Provider value={{
    ...estado,
    ingresar: (datos) => autenticar('/auth/login', datos),
    registrar: (datos) => autenticar('/auth/registro', datos),
    salir,
    reintentar: () => setIntento((value) => value + 1),
  }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider es obligatorio.');
  return context;
}
