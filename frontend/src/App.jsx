import { Route, Routes } from 'react-router-dom';
import Inicio from './pages/tienda/Inicio.jsx';
import Login from './pages/tienda/Login.jsx';
import Registro from './pages/tienda/Registro.jsx';
import Encabezado from './components/Encabezado.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import RutaAdmin from './components/RutaAdmin.jsx';

export default function App() {
  return (
    <><Encabezado /><Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/ingresar" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route element={<RutaProtegida />}>
        <Route element={<RutaAdmin />}>
          <Route path="/admin/*" element={<main><h1>Administración</h1><p>Tu sesión de administrador está activa.</p></main>} />
        </Route>
      </Route>
      <Route path="*" element={<main><h1>Página no encontrada</h1><a href="/">Volver al inicio</a></main>} />
    </Routes></>
  );
}
