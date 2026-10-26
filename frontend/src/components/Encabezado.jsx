import { useEffect, useState } from 'react';
import { motion, useAnimation, useReducedMotion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { NOMBRE_TIENDA } from '../utils/constantes.js';
import styles from './Encabezado.module.css';
import PanelMovil from './PanelMovil.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Encabezado() {
  const { usuario, cargando, salir, errorSesion, reintentar } = useAuth();
  const { cantidadTotal, abrir, pulso, ocupado, cargando: cartCargando, error: cartError } = useCart();
  const rebote = useAnimation();
  const reduced = useReducedMotion();
  useEffect(() => {
    if (pulso && !reduced) rebote.start({ scale: [1, 1.18, 1], transition: { duration: .3 } });
  }, [pulso, reduced, rebote]);
  const [saliendo, setSaliendo] = useState(false);
  const [error, setError] = useState('');

  async function cerrarSesion() {
    setSaliendo(true);
    setError('');
    try { await salir(); } catch (failure) { setError(failure.message); }
    finally { setSaliendo(false); }
  }

  const sesion = cargando ? <span role="status">Cargando sesión…</span> : usuario ? <>
    <span className={styles.name}>Hola, {usuario.nombre}</span>
    {usuario.rol === 'admin' && <Link to="/admin">Administración</Link>}
    {usuario.rol === 'cliente' && <Link to="/mis-pedidos">Mis pedidos</Link>}
    <button onClick={cerrarSesion} disabled={saliendo || ocupado || (cartCargando && !cartError)}>{saliendo ? 'Cerrando…' : 'Salir'}</button>
  </> : <Link className={styles.login} to="/ingresar">Ingresar <span aria-hidden="true">↗</span></Link>;

  return <header className={styles.header}>
    <div className={styles.row}>
      <Link className={styles.brand} to="/" aria-label={`${NOMBRE_TIENDA}, inicio`}>{NOMBRE_TIENDA}<span>Guatemala · Estilo propio</span></Link>
      <nav aria-label="Navegación principal" className={`${styles.nav} ${styles.desktop}`}><Link to="/">Inicio</Link><Link to="/gorras">Gorras</Link>{sesion}</nav>
      <div className={styles.actions}>
        <motion.button animate={rebote} className={styles.cart} onClick={abrir} aria-label={`Abrir carrito, ${cantidadTotal} productos`} title="Ver carrito">
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7ZM8 8V6a4 4 0 0 1 8 0v2" /></svg><span aria-live="polite">{cantidadTotal}</span>
        </motion.button>
        <PanelMovil titulo={`Explora ${NOMBRE_TIENDA}`} boton="Menú ☰" className={styles.mobile}><nav className={styles.mobileNav} aria-label="Navegación móvil"><Link to="/">Inicio</Link><Link to="/gorras">Todas las gorras</Link>{sesion}</nav></PanelMovil>
      </div>
    </div>
    {error && <p role="alert">{error}</p>}
    {errorSesion && <div role="alert">{errorSesion} <button onClick={reintentar}>Reintentar conexión</button></div>}
  </header>;
}
