import { Link } from 'react-router-dom';
import CapSvg from './CapSvg.jsx';

export default function NoEncontrada(){return <main className="errorGlobal"><CapSvg estilo="bucket" color="#1F6F54" tamano={240}/><p>404</p><h1>Esta ruta se quedó sin gorra.</h1><p>No encontramos la página que buscas.</p><Link to="/gorras">Explorar gorras ↗</Link><Link to="/">Volver al inicio</Link></main>;}
