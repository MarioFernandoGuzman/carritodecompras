import { useEffect, useRef } from 'react';
import { motion, useAnimation, useReducedMotion } from 'framer-motion';
import { useCart } from '../context/CartContext.jsx';
import ContenidoCarrito from './ContenidoCarrito.jsx';
import ToastCarrito from './ToastCarrito.jsx';
import styles from './Carrito.module.css';

export default function CartDrawer() {
  const { abierto, cerrar, cantidadTotal } = useCart();
  const dialog = useRef(null);
  const botonCerrar = useRef(null);
  const controls = useAnimation();
  const reduced = useReducedMotion();
  useEffect(() => {
    let vigente = true;
    if (abierto) {
      if (!dialog.current.open) dialog.current.showModal();
      document.body.style.overflow = 'hidden';
      controls.start({ x: 0, transition: { duration: reduced ? 0 : .22 } });
    } else if (dialog.current.open) {
      controls.start({ x: reduced ? 0 : '100%', transition: { duration: reduced ? 0 : .18 } }).then(() => {
        if (vigente) { dialog.current?.close(); document.body.style.overflow = ''; }
      });
    }
    return () => { vigente = false; };
  }, [abierto, controls, reduced]);
  useEffect(() => () => { document.body.style.overflow = ''; }, []);
  useEffect(() => {
    if (abierto && dialog.current.open && !dialog.current.contains(document.activeElement)) botonCerrar.current?.focus();
  }, [abierto, cantidadTotal]);

  function atraparFoco(event) {
    if (event.key !== 'Tab') return;
    const elementos = [...dialog.current.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]')]
      .filter((elemento) => elemento.getClientRects().length > 0);
    const primero = elementos[0];
    const ultimo = elementos.at(-1);
    if (event.shiftKey && document.activeElement === primero) { event.preventDefault(); ultimo?.focus(); }
    else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primero?.focus(); }
  }

  return <dialog ref={dialog} className={styles.drawer} aria-labelledby="carrito-titulo" onKeyDown={atraparFoco} onCancel={(event) => { event.preventDefault(); cerrar(); }} onClose={cerrar} onClick={(event) => { if (event.target === event.currentTarget) cerrar(); }}>
    <motion.div className={styles.panel} initial={{ x: reduced ? 0 : '100%' }} animate={controls}>
      <header className={styles.drawerHeader}><div><p>BUENAS ELECCIONES</p><h2 id="carrito-titulo">Tu carrito <span>({cantidadTotal})</span></h2></div><button ref={botonCerrar} autoFocus aria-label="Cerrar carrito" onClick={cerrar}>✕</button></header>
      <div className={styles.drawerBody}><ContenidoCarrito compacto /></div>
      <ToastCarrito dentro />
    </motion.div>
  </dialog>;
}
