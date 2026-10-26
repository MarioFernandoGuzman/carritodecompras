import CapSvg from './CapSvg.jsx';
import { moneda } from '../utils/moneda.js';
import { estadosPedido, fechaPedido } from '../utils/checkout.js';
import styles from './Pedidos.module.css';

export function EstadoPedido({ estado }) {
  return <span className={`${styles.badge} ${styles[estado] || ''}`}>{estadosPedido[estado] || estado}</span>;
}

export function ItemsPedido({ items }) {
  return <ul className={styles.items}>{items.map((item) => <li key={item.variante_id || item.varianteId}>
    <div className={styles.cap}><CapSvg color={item.color_hex} estilo={item.estilo} tamano="100%" /></div><div><strong>{item.nombre_producto || item.nombre}</strong><p>{item.color_nombre} · {item.talla}</p><p>{item.cantidad} × {moneda(item.precio_unitario)}</p></div><strong>{moneda(item.subtotal)}</strong>
  </li>)}</ul>;
}

export function TotalesPedido({ subtotal, envio, total }) {
  return <dl className={styles.totales}><div><dt>Subtotal</dt><dd>{moneda(subtotal)}</dd></div><div><dt>Envío</dt><dd>{Number(envio) ? moneda(envio) : 'Gratis'}</dd></div><div><dt>Total</dt><dd>{moneda(total)}</dd></div></dl>;
}

export default function DetallePedido({ pedido }) {
  return <div className={styles.detalle}>
    <div className={styles.encabezado}><h2>{pedido.codigo}</h2><EstadoPedido estado={pedido.estado} /></div>
    <ItemsPedido items={pedido.items} /><TotalesPedido {...pedido} />
    <div className={styles.datos}><h3>Tu entrega</h3><p>{pedido.nombre_destinatario} · {pedido.telefono_contacto}</p><p>{pedido.direccion_envio}, {pedido.ciudad}</p>{pedido.notas && <p>{pedido.notas}</p>}<p>{pedido.metodo_pago === 'tarjeta' ? `${pedido.pago_marca === 'visa' ? 'Visa' : 'Mastercard'} ···· ${pedido.pago_ultimos4}` : 'Pago contra entrega'}</p></div>
    <h3>Así va tu pedido</h3><ol className={styles.timeline}>{pedido.historial.map((h) => <li key={h.id}><strong>{estadosPedido[h.estado]}</strong><time dateTime={h.creado_en}>{fechaPedido(h.creado_en)}</time></li>)}</ol>
  </div>;
}
