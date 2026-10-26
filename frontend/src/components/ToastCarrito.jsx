import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import styles from './Carrito.module.css';

export default function ToastCarrito({ dentro = false }) {
  const { notificacion, abierto, descartarToast } = useCart();
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setError(''); setOcupado(false); }, [notificacion?.id]);
  if (!notificacion || (!dentro && abierto)) return null;
  return <div className={`${styles.toast} ${dentro ? styles.toastDentro : ''}`} role="status" key={notificacion.id}>
    <p>{error || notificacion.mensaje}</p>
    {notificacion.accion && <button disabled={ocupado} onClick={async () => {
      setOcupado(true); setError('');
      try { await notificacion.accion(); } catch (failure) { setError(failure.message); }
      finally { setOcupado(false); }
    }}>{ocupado ? 'Restaurando…' : 'Deshacer'}</button>}
    <button aria-label="Cerrar aviso" onClick={descartarToast}>✕</button>
  </div>;
}
