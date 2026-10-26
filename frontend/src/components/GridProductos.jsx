import ProductCard from './ProductCard.jsx';
import styles from '../styles/catalogo.module.css';

export default function GridProductos({ productos = [], cargando, error, recargar, limpiar }) {
  if (error) return <div className={styles.empty} role="alert"><h2>No pudimos cargar las gorras.</h2><p>{error}</p><button onClick={recargar}>Volver a intentar</button></div>;
  if (cargando) return <div role="status"><span className="soloLectores">Cargando gorras…</span><div className={styles.grid} aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <div key={i} className={styles.skeleton} />)}</div></div>;
  if (!productos.length) return <div className={styles.empty}><span aria-hidden="true">↗</span><h2>No hay gorras con esos filtros.</h2><p>Prueba otro color, talla o rango de precio.</p>{limpiar && <button onClick={limpiar}>Limpiar filtros</button>}</div>;
  return <div className={styles.grid}>{productos.map((producto) => <ProductCard key={producto.id} producto={producto} />)}</div>;
}
