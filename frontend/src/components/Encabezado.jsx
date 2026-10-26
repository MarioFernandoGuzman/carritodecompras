import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { NOMBRE_TIENDA } from '../utils/constantes.js';
import styles from './Encabezado.module.css';

export default function Encabezado() {
  const { usuario, cargando, salir, errorSesion, reintentar } = useAuth();
  const [saliendo, setSaliendo] = useState(false);
  const [error, setError] = useState('');

  async function cerrarSesion() {
    setSaliendo(true);
    setError('');
    try { await salir(); } catch (failure) { setError(failure.message); }
    finally { setSaliendo(false); }
  }

  return <header className={styles.header}>
    <div className={styles.row}>
      <Link className={styles.brand} to="/" aria-label={`${NOMBRE_TIENDA}, inicio`}>{NOMBRE_TIENDA}<span>Guatemala · Estilo propio</span></Link>
      <nav aria-label="Navegación principal" className={styles.nav}>
        {cargando ? <span role="status">Cargando sesión…</span> : usuario ? <>
          <span className={styles.name}>Hola, {usuario.nombre}</span>
          {usuario.rol === 'admin' && <Link to="/admin">Administración</Link>}
          <button onClick={cerrarSesion} disabled={saliendo}>{saliendo ? 'Cerrando…' : 'Salir'}</button>
        </> : <Link className={styles.login} to="/ingresar">Ingresar <span aria-hidden="true">↗</span></Link>}
      </nav>
    </div>
    {error && <p role="alert">{error}</p>}
    {errorSesion && <div role="alert">{errorSesion} <button onClick={reintentar}>Reintentar conexión</button></div>}
  </header>;
}
