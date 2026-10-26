import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RutaAdmin() {
  const { usuario } = useAuth();
  return usuario?.rol === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
}
