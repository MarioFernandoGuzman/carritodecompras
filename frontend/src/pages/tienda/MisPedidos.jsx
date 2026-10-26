import { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRecurso } from '../../utils/useRecurso.js';
import { solicitar } from '../../api/cliente.js';
import { useCart } from '../../context/CartContext.jsx';
import DetallePedido, { EstadoPedido } from '../../components/DetallePedido.jsx';
import CapSvg from '../../components/CapSvg.jsx';
import { moneda } from '../../utils/moneda.js';
import { fechaPedido } from '../../utils/checkout.js';
import styles from '../../components/Pedidos.module.css';

function FilaPedido({ pedido }) {
  const [detalle, setDetalle] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  const tituloId = useId();
  const { recargar } = useCart();
  const actual = detalle || pedido;
  async function ver() {
    if (abierto) { setAbierto(false); return; }
    setCargando(true); setError('');
    try { setDetalle(await solicitar(`/pedidos/${pedido.id}`)); setAbierto(true); }
    catch (failure) { setError(failure.message); }
    finally { setCargando(false); }
  }
  async function cancelar() {
    if (cancelando) return;
    setCancelando(true); setError('');
    try {
      setDetalle(await solicitar(`/pedidos/${pedido.id}/cancelar`, { method: 'POST', body: {} }));
      dialog.current.close(); recargar();
    } catch (failure) { setError(failure.message); }
    finally { setCancelando(false); }
  }
  return <article className={styles.order}>
    <div className={styles.encabezado}><h2>{pedido.codigo}</h2><EstadoPedido estado={actual.estado} /></div>
    <div className={styles.orderMeta}><time dateTime={pedido.creado_en}>{fechaPedido(pedido.creado_en)}</time><span>{pedido.cantidad_articulos} artículos</span><strong>{moneda(pedido.total)}</strong></div>
    <button className={styles.secondary} disabled={cargando || cancelando} aria-expanded={abierto} onClick={ver}>{cargando ? 'Cargando…' : abierto ? 'Ocultar detalle' : `Ver detalle de ${pedido.codigo}`}</button>
    {error && !dialog.current?.open && <p className={styles.error} role="alert">{error}</p>}
    {abierto && detalle && <><DetallePedido pedido={detalle} />{['pendiente', 'pagado'].includes(actual.estado) && <button className={styles.secondary} onClick={() => { setError(''); dialog.current.showModal(); }}>Cancelar pedido {pedido.codigo}</button>}</>}
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={tituloId} onCancel={(event) => { if (cancelando) event.preventDefault(); }}><h2 id={tituloId}>¿Cancelar {pedido.codigo}?</h2><p>Los artículos regresarán al inventario. Esta acción no se puede deshacer.</p>{error && <p className={styles.error} role="alert">{error}</p>}<div className={styles.actions}><button autoFocus className={styles.secondary} disabled={cancelando} onClick={() => dialog.current.close()}>Conservar pedido</button><button disabled={cancelando} onClick={cancelar}>{cancelando ? 'Cancelando…' : 'Sí, cancelar pedido'}</button></div></dialog>
  </article>;
}

export default function MisPedidos() {
  const recurso = useRecurso('/pedidos');
  return <main className={styles.page}><p className={styles.eyebrow}>CADA ELECCIÓN TIENE SU HISTORIA</p><h1>Mis pedidos.</h1>
    {recurso.cargando ? <p role="status">Cargando tus pedidos…</p> : recurso.error ? <div className={styles.error} role="alert">{recurso.error} <button onClick={recurso.recargar}>Reintentar</button></div> : !recurso.data.length ? <div className={styles.empty}><CapSvg color="#1F6F54" tamano={220} /><h2>Tu historia empieza con una gorra.</h2><p>Aquí encontrarás tus pedidos y su estado.</p><Link className={styles.secondary} to="/gorras">Ver gorras ↗</Link></div> : recurso.data.map((pedido) => <FilaPedido key={pedido.id} pedido={pedido} />)}
  </main>;
}
