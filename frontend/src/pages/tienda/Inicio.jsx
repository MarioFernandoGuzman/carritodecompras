import { Link } from 'react-router-dom';
import CapSvg from '../../components/CapSvg.jsx';
import GridProductos from '../../components/GridProductos.jsx';
import { useRecurso } from '../../utils/useRecurso.js';
import { NOMBRE_TIENDA } from '../../utils/constantes.js';
import { useCart } from '../../context/CartContext.jsx';
import { moneda } from '../../utils/moneda.js';
import styles from '../../styles/catalogo.module.css';

export default function Inicio() {
  const { config } = useCart();
  const destacados = useRecurso('/productos?orden=destacados&limite=4');
  const categorias = useRecurso('/categorias');
  const estilos = ['snapback', 'dad', 'trucker', 'bucket'];

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="titulo">
        <div className={styles.heroCopy}><p className={styles.eyebrow}>GUATEMALA · ESTILO SIN EXCUSAS</p><h1 id="titulo">Tu estilo<br />empieza<br /><em>arriba.</em></h1><p>Gorras para salir, explorar y ser tú.<br />Elige la que va contigo.</p><Link className={styles.cta} to="/gorras">Encuentra tu gorra <span aria-hidden="true">↗</span></Link></div>
        <div className={styles.heroArt}><span className={styles.heroStamp}>{NOMBRE_TIENDA} / ESTILO PROPIO</span><div className={styles.orbit} aria-hidden="true" /><CapSvg estilo="snapback" color="#1F6F54" tamano="100%" /><span className={styles.heroSeal}>HECHA PARA<br /><strong>TU DÍA.</strong></span><span className={styles.heroFoot}>01 / UNA FORMA DE LLEVAR LO TUYO</span></div>
      </section>
      <section className={styles.section} aria-labelledby="categorias-titulo"><div className={styles.sectionHead}><div><p className={styles.eyebrow}>DIFERENTES FORMAS. MISMA ACTITUD.</p><h2 id="categorias-titulo">Encuentra tu silueta.</h2></div><Link to="/gorras">Ver todas ↗</Link></div>
        {categorias.error ? <div role="alert">{categorias.error} <button onClick={categorias.recargar}>Reintentar</button></div> : categorias.cargando ? <p role="status">Cargando categorías…</p> : <div className={styles.categories}>{categorias.data.map((c, index) => <Link key={c.id} to={`/gorras?categoria=${c.slug}`}><CapSvg estilo={estilos[index] || 'bucket'} color={['#14110F', '#E4572E', '#1F6F54', '#D8C3A5'][index % 4]} /><span>{c.nombre}<span aria-hidden="true">↗</span></span></Link>)}</div>}
      </section>
      <section className={styles.section} aria-labelledby="destacados-titulo"><div className={styles.sectionHead}><div><p className={styles.eyebrow}>PARA PONERTE EN MODO TÚ</p><h2 id="destacados-titulo">Se llevan las miradas.</h2></div><Link to="/gorras">Explorar catálogo ↗</Link></div><div className={styles.featured}><GridProductos productos={destacados.data?.productos} {...destacados} /></div></section>
      <section className={styles.shipping}><div><p className={styles.eyebrow}>UN MOTIVO MÁS PARA ELEGIR</p><h2>Tu estilo llega más lejos.</h2><p>{config ? <>Envío gratis en compras desde <strong>{moneda(config.gratisDesde)}</strong>.</> : 'Consulta las opciones de envío al continuar.'}</p></div><Link to="/gorras">Explora las gorras <span aria-hidden="true">↗</span></Link></section>
    </main>
  );
}
