import { Link, useSearchParams } from 'react-router-dom';
import { useRecurso } from '../../utils/useRecurso.js';
import GridProductos from '../../components/GridProductos.jsx';
import PanelMovil from '../../components/PanelMovil.jsx';
import styles from '../../styles/catalogo.module.css';

function Filtros({ categorias, query, aplicar, sufijo }) {
  const campos = [
    { nombre: 'color', label: 'Color', list: `colores-${sufijo}`, placeholder: 'Todos los colores' },
    { nombre: 'talla', label: 'Talla', list: `tallas-${sufijo}`, placeholder: 'Todas las tallas' },
    { nombre: 'min', label: 'Precio mínimo (Q)', type: 'number', min: '0', step: '.01' },
    { nombre: 'max', label: 'Precio máximo (Q)', type: 'number', min: '0', step: '.01' },
  ];
  return <form onSubmit={aplicar} className={styles.filters} key={query.toString()}>
    <label htmlFor={`categoria-${sufijo}`}>Categoría</label>
    <select id={`categoria-${sufijo}`} name="categoria" defaultValue={query.get('categoria') || ''}><option value="">Todas las categorías</option>{categorias.map((c) => <option key={c.id} value={c.slug}>{c.nombre}</option>)}</select>
    {campos.map(({ nombre, label, ...props }) => <div key={nombre}><label htmlFor={`${nombre}-${sufijo}`}>{label}</label><input {...props} id={`${nombre}-${sufijo}`} name={nombre} defaultValue={query.get(nombre) || ''} maxLength={nombre === 'color' ? 40 : nombre === 'talla' ? 20 : undefined} /></div>)}
    <datalist id={`colores-${sufijo}`}><option value="Negro" /><option value="Verde jade" /><option value="Arena" /></datalist>
    <datalist id={`tallas-${sufijo}`}><option value="Ajustable" /><option value="S/M" /><option value="L/XL" /></datalist>
    <button type="submit">Aplicar filtros</button><Link to="/gorras">Limpiar filtros</Link>
  </form>;
}

export default function Catalogo() {
  const [query, setQuery] = useSearchParams();
  const apiQuery = new URLSearchParams(query);
  if (!apiQuery.has('limite')) apiQuery.set('limite', '6');
  const recurso = useRecurso(`/productos?${apiQuery}`);
  const categorias = useRecurso('/categorias');
  const paginas = recurso.data?.paginacion;

  function cambiar(nombre, valor) {
    const siguiente = new URLSearchParams(query);
    siguiente.delete('pagina');
    if (valor) siguiente.set(nombre, valor); else siguiente.delete(nombre);
    setQuery(siguiente);
  }

  function aplicar(event) {
    event.preventDefault();
    const siguiente = new URLSearchParams(query);
    siguiente.delete('pagina');
    for (const [nombre, value] of new FormData(event.currentTarget)) {
      if (value.trim()) siguiente.set(nombre, value.trim()); else siguiente.delete(nombre);
    }
    setQuery(siguiente);
  }

  function enlacePagina(numero) {
    const siguiente = new URLSearchParams(query); siguiente.set('pagina', String(numero));
    return `/gorras?${siguiente}`;
  }

  const filtrosProps = { categorias: categorias.data || [], query, aplicar };
  return <main className={styles.page}>
    <div className={styles.pageHeading}><p className={styles.eyebrow}>ENCUENTRA TU FORMA</p><h1>Gorras con carácter<span>.</span></h1><p>Una para cada día. Una forma de ser tú.</p></div>
    <div className={styles.toolbar}>
      <form onSubmit={(event) => { event.preventDefault(); cambiar('buscar', new FormData(event.currentTarget).get('buscar').trim()); }} className={styles.search} key={query.get('buscar') || ''}>
        <label className="soloLectores" htmlFor="buscar">Buscar gorras</label><input type="search" id="buscar" name="buscar" maxLength={100} defaultValue={query.get('buscar') || ''} placeholder="Busca tu próxima gorra…" /><button type="submit" aria-label="Buscar gorras">↗</button>
      </form>
      <PanelMovil titulo="Filtra a tu estilo" boton="Filtros +" className={styles.mobileFilters}><Filtros {...filtrosProps} sufijo="movil" /></PanelMovil>
      <div className={styles.sort}><label htmlFor="orden">Ordenar</label><select id="orden" value={query.get('orden') || 'destacados'} onChange={(e) => cambiar('orden', e.target.value)}><option value="destacados">Destacados</option><option value="nuevos">Más nuevos</option><option value="precio_asc">Menor precio</option><option value="precio_desc">Mayor precio</option></select></div>
    </div>
    <div className={styles.catalogLayout}>
      <aside className={styles.sidebar} aria-label="Filtros del catálogo"><h2>Tu gorra, a tu medida.</h2><Filtros {...filtrosProps} sufijo="escritorio" /></aside>
      <section aria-label="Productos" className={styles.results}>
        {categorias.error && <p role="alert">No pudimos cargar las categorías. <button onClick={categorias.recargar}>Reintentar</button></p>}
        <div className={styles.resultHeader}><p role="status">{recurso.cargando ? 'Buscando tu estilo…' : paginas ? `${paginas.total} gorras encontradas` : 'Revisa tus filtros'}</p><label>Ver <select aria-label="Productos por página" value={query.get('limite') || '6'} onChange={(e) => cambiar('limite', e.target.value)}><option value="6">6</option><option value="12">12</option><option value="24">24</option></select></label></div>
        <GridProductos productos={recurso.data?.productos} {...recurso} limpiar={() => setQuery({})} />
        {recurso.error && <Link to="/gorras">Restablecer filtros</Link>}
        {paginas && paginas.paginas > 0 && <nav className={styles.pagination} aria-label="Páginas del catálogo">
          {paginas.pagina > 1 && <Link to={enlacePagina(Math.min(paginas.pagina - 1, paginas.paginas))}>← Anterior</Link>}
          <span aria-live="polite">Página {paginas.pagina} de {paginas.paginas}</span>
          {paginas.pagina < paginas.paginas && <Link to={enlacePagina(paginas.pagina + 1)}>Siguiente →</Link>}
        </nav>}
      </section>
    </div>
  </main>;
}
