import { Link, useParams } from 'react-router-dom';
import { useRecurso } from '../../utils/useRecurso.js';
import DetallePedido from '../../components/DetallePedido.jsx';
import Carga from '../../components/Carga.jsx';
import styles from '../../components/Pedidos.module.css';

export default function ConfirmacionPedido() {
  const { codigo } = useParams();
  const id = /^VIS-\d{6,10}$/.test(codigo) ? Number(codigo.slice(4)) : 0;
  const recurso = useRecurso(`/pedidos/${id}`);
  return <main className={`${styles.page} ${styles.confirmacion}`}>
    {recurso.cargando ? <Carga texto="Cargando tu pedido…"/> : recurso.error || recurso.data.codigo !== codigo ? <div className={styles.error} role="alert"><h1>No encontramos ese pedido.</h1><p>{recurso.error || 'Revisa el código del pedido.'}</p><Link to="/mis-pedidos">Ver mis pedidos</Link></div> : <>
      <p className={styles.eyebrow}>GRACIAS POR ELEGIR TU ESTILO</p><h1>Tu pedido está confirmado.</h1><p>Guardamos los detalles para que puedas seguir su estado.</p><DetallePedido pedido={recurso.data} /><p className={styles.aviso}>Pago de demostración, no se realizará ningún cargo</p><div className={styles.actions}><Link className={styles.secondary} to="/gorras">Seguir comprando ↗</Link><Link className={styles.secondary} to="/mis-pedidos">Ver mis pedidos</Link></div>
    </>}
  </main>;
}
