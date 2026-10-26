import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CapSvg from '../../components/CapSvg.jsx';
import { useRecurso } from '../../utils/useRecurso.js';
import { moneda } from '../../utils/moneda.js';
import styles from '../../styles/catalogo.module.css';
import { useCart } from '../../context/CartContext.jsx';

function Detalle({ producto }) {
  const { agregar, cargando, ocupado, items, config } = useCart();
  const [error, setError] = useState('');
  const inicial = producto.variantes.find((v) => v.stock > 0) || producto.variantes[0];
  const [color, setColor] = useState(inicial.color_nombre);
  const [talla, setTalla] = useState(inicial.talla);
  const colores = [...new Map(producto.variantes.map((v) => [v.color_nombre, { nombre: v.color_nombre, hex: v.color_hex }])).values()];
  const tallas = [...new Set(producto.variantes.map((v) => v.talla))];
  const variante = producto.variantes.find((v) => v.color_nombre === color && v.talla === talla);
  const hex = colores.find((c) => c.nombre === color)?.hex;
  const limite = variante && (items.find((i) => i.varianteId === variante.id)?.cantidad || 0) >= variante.stock;

  async function anadir() {
    if (!variante?.stock) return;
    setError('');
    try { await agregar({ varianteId: variante.id, slug: producto.slug }); }
    catch (failure) { setError(failure.message); }
  }

  function elegirColor(nombre) {
    setColor(nombre);
    const actual = producto.variantes.find((v) => v.color_nombre === nombre && v.talla === talla && v.stock > 0);
    if (!actual) setTalla(producto.variantes.find((v) => v.color_nombre === nombre && v.stock > 0)?.talla || '');
  }

  return <>
    <nav className={styles.breadcrumb} aria-label="Ruta de navegación"><Link to="/gorras">Gorras</Link><span>/</span><Link to={`/gorras?categoria=${producto.categoria.slug}`}>{producto.categoria.nombre}</Link></nav>
    <div className={styles.detail}>
      <div className={styles.detailArt}><span className={styles.artLabel}>ESTILO PROPIO · {producto.categoria.nombre}</span><CapSvg color={hex} estilo={producto.estilo} tamano="100%" /><span className={styles.artFoot}>Hecha para acompañarte. Diseñada para destacar.</span></div>
      <section className={styles.detailInfo} aria-labelledby="producto-titulo">
        <p className={styles.eyebrow}>{producto.categoria.nombre}</p><h1 id="producto-titulo">{producto.nombre}</h1><p className={styles.detailPrice}>{moneda(producto.precio)}</p><p className={styles.description}>{producto.descripcion}</p>
        <fieldset className={styles.options}><legend>Color: <strong>{color}</strong></legend><div className={styles.swatches}>
          {colores.map((c) => {
            const disponible = producto.variantes.some((v) => v.color_nombre === c.nombre && v.stock > 0);
            return <button type="button" key={c.nombre} disabled={!disponible} aria-label={`${c.nombre}${disponible ? '' : ', agotado'}`} aria-pressed={color === c.nombre} title={c.nombre} onClick={() => elegirColor(c.nombre)}><span style={{ background: c.hex }} />{!disponible && <i aria-hidden="true">/</i>}</button>;
          })}
        </div></fieldset>
        <fieldset className={styles.options}><legend>Talla</legend><div className={styles.sizes}>
          {tallas.map((t) => {
            const disponible = producto.variantes.some((v) => v.color_nombre === color && v.talla === t && v.stock > 0);
            return <button key={t} type="button" aria-pressed={talla === t} disabled={!disponible} onClick={() => setTalla(t)} aria-label={`${t}${disponible ? '' : ', agotada'}`}>{t}</button>;
          })}
        </div></fieldset>
        <p className={styles.stock} role="status">{producto.agotado ? 'Esta gorra está agotada por ahora.' : !variante?.stock ? 'Elige una variante disponible.' : variante.stock <= variante.stock_minimo ? `¡Últimas ${variante.stock} unidades!` : `${variante.stock} unidades disponibles`}</p>
        <button className={styles.add} disabled={!variante?.stock || limite || cargando || ocupado} onClick={anadir} aria-describedby="aviso-carrito">{ocupado ? 'Actualizando…' : 'Agregar al carrito'} <span aria-hidden="true">↗</span></button><p id="aviso-carrito" className={styles.note}>{limite ? 'Ya tienes el stock disponible en tu carrito.' : 'Elige tu color y talla para agregar esta gorra.'}</p>
        {error && <p role="alert">{error}</p>}
        <dl className={styles.facts}><div><dt>Material</dt><dd>{producto.material || 'Sin especificar'}</dd></div><div><dt>Envío</dt><dd>{config ? `Gratis desde ${moneda(config.gratisDesde)}` : 'Consultando tarifa…'}</dd></div></dl>
      </section>
    </div>
  </>;
}

export default function Producto() {
  const { slug } = useParams();
  const recurso = useRecurso(`/productos/${encodeURIComponent(slug)}`);
  return <main className={styles.page}>{recurso.cargando ? <div className={styles.detail} role="status"><div className={styles.skeleton} /><div className={styles.skeleton} /><span className="soloLectores">Cargando gorra…</span></div> : recurso.error ? <div className={styles.empty} role="alert"><h1>No encontramos tu gorra.</h1><p>{recurso.error}</p><button onClick={recurso.recargar}>Volver a intentar</button><Link to="/gorras">Explorar catálogo</Link></div> : <Detalle key={recurso.data.id} producto={recurso.data} />}</main>;
}
