import { useEffect, useState } from 'react';
import { solicitar } from '../api/cliente.js';

export function useRecurso(ruta) {
  const [estado, setEstado] = useState({ data: null, cargando: true, error: '' });
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setEstado({ data: null, cargando: true, error: '' });
    solicitar(ruta, { signal: controller.signal })
      .then((data) => setEstado({ data, cargando: false, error: '' }))
      .catch((error) => {
        if (error.name !== 'AbortError') setEstado({ data: null, cargando: false, error: error.message });
      });
    return () => controller.abort();
  }, [ruta, intento]);
  return { ...estado, recargar: () => setIntento((value) => value + 1) };
}
