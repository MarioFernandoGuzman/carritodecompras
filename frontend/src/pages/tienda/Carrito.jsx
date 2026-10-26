import ContenidoCarrito from '../../components/ContenidoCarrito.jsx';
import { useEffect } from 'react';
import { useCart } from '../../context/CartContext.jsx';
import { useLocation } from 'react-router-dom';
import styles from '../../components/Carrito.module.css';

export default function Carrito() {
  const { recargar } = useCart();
  const { state } = useLocation();
  useEffect(() => { recargar(); }, [recargar]);
  return <main className={styles.page}><p className={styles.eyebrow}>TU ESTILO, A UN PASO</p><h1>Lo que va contigo.</h1>{state?.errorStock && <p className={styles.error} role="alert">{state.errorStock} Revisa las cantidades antes de continuar.</p>}<ContenidoCarrito /></main>;
}
