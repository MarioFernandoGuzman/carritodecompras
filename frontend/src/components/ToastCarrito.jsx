import { useCart } from '../context/CartContext.jsx';
import { ToastMensaje } from './Notificaciones.jsx';

export default function ToastCarrito({ dentro = false }) {
  const { notificacion, abierto, descartarToast } = useCart();
  if (!notificacion || (!dentro && abierto)) return null;
  return <ToastMensaje key={notificacion.id} {...notificacion} dentro={dentro} cerrar={descartarToast}/>;
}
