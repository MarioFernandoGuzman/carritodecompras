import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Carga from './Carga.jsx';

export default function RutaProtegida() {
  const { usuario, cargando, errorSesion } = useAuth();
  const location = useLocation();
  if (cargando) return <main><Carga texto="Recuperando tu sesión…"/></main>;
  if (errorSesion) return <main>No pudimos recuperar tu sesión. Usa «Reintentar conexión» en el encabezado.</main>;
  return usuario ? <Outlet /> : <Navigate to="/ingresar" state={{ desde: location.pathname + location.search }} replace />;
}
