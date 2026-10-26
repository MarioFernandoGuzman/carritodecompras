import { useEffect } from 'react';
import { Link, useLocation, useOutlet } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Encabezado from './Encabezado.jsx';
import CartDrawer from './CartDrawer.jsx';
import ToastCarrito from './ToastCarrito.jsx';
import { NOMBRE_TIENDA } from '../utils/constantes.js';
import styles from '../styles/catalogo.module.css';

export default function Layout() {
  const location = useLocation();
  const outlet = useOutlet();
  const reduced = useReducedMotion();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [location.pathname, location.search]);
  return <>
    <a className="saltar" href="#contenido">Saltar al contenido</a>
    <Encabezado />
    <CartDrawer /><ToastCarrito />
      <motion.div key={location.pathname} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .15 }} id="contenido" tabIndex={-1}>
        {outlet}
      </motion.div>
    <footer className={styles.footer}><div><strong>{NOMBRE_TIENDA}</strong><p>Hecho para tu día. Con estilo propio.</p></div><nav aria-label="Enlaces del pie de página"><Link to="/gorras">Todas las gorras</Link><Link to="/ingresar">Mi cuenta</Link></nav><span>Guatemala · Precios en quetzales</span></footer>
  </>;
}
