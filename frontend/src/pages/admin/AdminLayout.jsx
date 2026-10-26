import { NavLink, Outlet } from 'react-router-dom';
import PanelMovil from '../../components/PanelMovil.jsx';
import styles from './Admin.module.css';

const enlaces=[['','Resumen'],['productos','Productos'],['inventario','Inventario'],['pedidos','Pedidos'],['usuarios','Usuarios'],['clientes','Clientes']];
function Navegacion(){return <nav aria-label="Administración">{enlaces.map(([ruta,label])=><NavLink key={ruta} end to={`/admin${ruta?`/${ruta}`:''}`}>{label}</NavLink>)}</nav>;}
export default function AdminLayout(){return <div className={styles.layout}><aside className={styles.sidebar}><p>ADMINISTRACIÓN</p><Navegacion /></aside><section className={styles.content}><PanelMovil titulo="Administración" boton="Secciones ☰" className={styles.mobile}><Navegacion /></PanelMovil><Outlet /></section></div>;}
