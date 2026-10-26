import { Route, Routes } from 'react-router-dom';
import Inicio from './pages/tienda/Inicio.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="*" element={<main><h1>Página no encontrada</h1><a href="/">Volver al inicio</a></main>} />
    </Routes>
  );
}
