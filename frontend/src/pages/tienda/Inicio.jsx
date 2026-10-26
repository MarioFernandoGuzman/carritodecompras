import { useEffect, useState } from 'react';
import { obtenerSalud } from '../../api/client.js';
import { NOMBRE_TIENDA } from '../../utils/constantes.js';
import styles from './Inicio.module.css';

export default function Inicio() {
  const [estado, setEstado] = useState('cargando');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setEstado('cargando');
    obtenerSalud(controller.signal)
      .then(() => setEstado('conectado'))
      .catch(() => {
        if (!controller.signal.aborted) setEstado('error');
      });
    return () => controller.abort();
  }, [intento]);

  return (
    <main className={styles.page}>
      <section className={styles.intro} aria-labelledby="titulo">
        <p className={styles.eyebrow}>Tienda de gorras · Guatemala</p>
        <h1 id="titulo">Tu estilo empieza arriba.</h1>
        <p>Estamos preparando nuestra tienda. La base del proyecto ya está en marcha.</p>
        <div className={styles.status} role="status" aria-live="polite">
          {estado === 'cargando' && 'Comprobando conexión con el servidor…'}
          {estado === 'conectado' && 'Conexión con el servidor correcta.'}
          {estado === 'error' && 'No pudimos conectar. Comprueba que el servidor esté encendido.'}
        </div>
        <button disabled={estado === 'cargando'} onClick={() => setIntento((value) => value + 1)}>
          Volver a comprobar
        </button>
      </section>
      <footer>{NOMBRE_TIENDA} · Hecho para tu día.</footer>
    </main>
  );
}
