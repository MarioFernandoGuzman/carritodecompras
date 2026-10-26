import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import CapSvg from './CapSvg.jsx';
import { moneda } from '../utils/moneda.js';
import styles from './Carrito.module.css';

export default function ContenidoCarrito({ compacto = false }) {
  const cart = useCart();
  const ejecutar = (accion) => { accion().catch(() => {}); };
  return <>
    {cart.error && <div className={styles.error} role="alert">{cart.error} <button onClick={cart.recargar} disabled={cart.ocupado}>Actualizar carrito</button></div>}
    {cart.avisos?.length > 0 && <div className={styles.avisos} role="status">{cart.avisos.map((aviso, index) => <p key={`${index}-${aviso}`}>{aviso}</p>)}</div>}
    {cart.cargando ? <p role="status">Actualizando tu carrito…</p> : !cart.items.length ? <div className={styles.empty}><CapSvg estilo="dad" color="#1F6F54" tamano={220} /><h2>Tu carrito está esperando tu estilo.</h2><p>Elige una gorra y hazla parte de tu día.</p><Link className={styles.primary} to="/gorras" onClick={cart.cerrar}>Ver gorras ↗</Link></div> : <div className={compacto ? styles.compacto : styles.contenido}>
      <section className={styles.lista} aria-label="Artículos del carrito">
        {cart.items.map((item) => <article key={item.varianteId} className={styles.item}>
          <Link className={styles.art} to={`/gorras/${item.slug}`} onClick={cart.cerrar} aria-label={`Ver ${item.nombre}`}><CapSvg color={item.color_hex} estilo={item.estilo} tamano="100%" /></Link>
          <div className={styles.itemInfo}><h3><Link to={`/gorras/${item.slug}`} onClick={cart.cerrar}>{item.nombre}</Link></h3><p>{item.color_nombre} · {item.talla}</p><p>{moneda(item.precio_unitario)} por unidad</p>
            <div className={styles.controles}><div className={styles.cantidad} aria-label={`Cantidad de ${item.nombre}`}>
              <button aria-label={`Disminuir ${item.nombre}`} disabled={cart.ocupado || item.cantidad <= 1} onClick={() => ejecutar(() => cart.modificar(item.varianteId, item.cantidad - 1))}>−</button><span aria-live="polite">{item.cantidad}</span><button aria-label={`Aumentar ${item.nombre}`} disabled={cart.ocupado || item.cantidad >= item.stock} onClick={() => ejecutar(() => cart.modificar(item.varianteId, item.cantidad + 1))}>+</button>
            </div><button className={styles.remove} disabled={cart.ocupado} aria-label={`Eliminar ${item.nombre}`} onClick={() => ejecutar(() => cart.eliminar(item.varianteId))}>Eliminar</button></div>
            {item.cantidad >= item.stock && <p className={styles.note}>Alcanzaste el stock disponible.</p>}
          </div><strong className={styles.lineaTotal}>{moneda(item.subtotal)}</strong>
        </article>)}
        {!compacto && <button className={styles.clear} disabled={cart.ocupado} onClick={() => ejecutar(cart.vaciar)}>Vaciar carrito</button>}
      </section>
      <aside className={styles.resumen} aria-label="Resumen del carrito"><h2>Tu próxima elección.</h2>
        {cart.config && cart.falta_envio_gratis !== null && <div className={styles.progreso}><p>{Number(cart.falta_envio_gratis) > 0 ? `Te faltan ${moneda(cart.falta_envio_gratis)} para envío gratis` : '¡Tu envío es gratis!'}</p><progress aria-label="Progreso hacia envío gratis" value={Math.min(Number(cart.subtotal), Number(cart.config.gratisDesde))} max={Number(cart.config.gratisDesde)} /></div>}
        <dl><div><dt>Subtotal</dt><dd>{moneda(cart.subtotal)}</dd></div><div><dt>Envío</dt><dd>{cart.envio === null ? 'Calculando…' : Number(cart.envio) ? moneda(cart.envio) : 'Gratis'}</dd></div><div className={styles.total}><dt>Total</dt><dd>{cart.total === null ? 'Calculando…' : moneda(cart.total)}</dd></div></dl>
        {cart.esVisitante && <p className={styles.note}>Los precios y la disponibilidad se confirman al continuar.</p>}
        <Link className={styles.primary} to="/checkout" onClick={cart.cerrar}>Pagar <span aria-hidden="true">↗</span></Link>
        {compacto && <Link className={styles.secondary} to="/carrito" onClick={cart.cerrar}>Ver carrito</Link>}
      </aside>
    </div>}
  </>;
}
