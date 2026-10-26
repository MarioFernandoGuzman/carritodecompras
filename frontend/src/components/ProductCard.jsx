import { useState } from 'react';
import { Link } from 'react-router-dom';
import CapSvg from './CapSvg.jsx';
import { moneda } from '../utils/moneda.js';
import styles from './ProductCard.module.css';

export default function ProductCard({ producto }) {
  const inicial = producto.colores.find((color) => color.disponible) || producto.colores[0];
  const [color, setColor] = useState(inicial);
  return <article className={styles.card}>
    <Link to={`/gorras/${producto.slug}`} className={styles.art} aria-label={`Ver ${producto.nombre}`}>
      {producto.agotado ? <span className={styles.badge}>Agotado</span> : producto.destacado && <span className={styles.badge}>Destacado</span>}
      <CapSvg estilo={producto.estilo} color={color?.hex} />
      <span className={styles.arrow} aria-hidden="true">↗</span>
    </Link>
    <div className={styles.info}>
      <p className={styles.category}>{producto.categoria.nombre}</p>
      <h3><Link to={`/gorras/${producto.slug}`}>{producto.nombre}</Link></h3>
      <p className={styles.price}>{moneda(producto.precio)}</p>
      <div className={styles.colors} aria-label={`Colores de ${producto.nombre}`}>
        {producto.colores.map((item) => <button key={item.nombre} type="button" aria-label={`${item.nombre}${item.disponible ? '' : ', agotado'}`}
          aria-pressed={color?.nombre === item.nombre} onMouseEnter={() => setColor(item)} onFocus={() => setColor(item)} onClick={() => setColor(item)} title={item.nombre}>
          <span style={{ background: item.hex }} />
        </button>)}
      </div>
    </div>
  </article>;
}
