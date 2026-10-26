import { Route, Routes } from 'react-router-dom';
import Inicio from './pages/tienda/Inicio.jsx';
import Login from './pages/tienda/Login.jsx';
import Registro from './pages/tienda/Registro.jsx';
import Layout from './components/Layout.jsx';
import Catalogo from './pages/tienda/Catalogo.jsx';
import Producto from './pages/tienda/Producto.jsx';
import Carrito from './pages/tienda/Carrito.jsx';
import Checkout from './pages/tienda/Checkout.jsx';
import ConfirmacionPedido from './pages/tienda/ConfirmacionPedido.jsx';
import MisPedidos from './pages/tienda/MisPedidos.jsx';
import RutaProtegida from './components/RutaProtegida.jsx';
import RutaAdmin from './components/RutaAdmin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import { Dashboard,ProductosAdmin,InventarioAdmin,PedidosAdmin,PersonasAdmin } from './pages/admin/AdminPages.jsx';

export default function App() {
  return (
    <Routes><Route element={<Layout />}>
      <Route path="/" element={<Inicio />} />
      <Route path="/gorras" element={<Catalogo />} />
      <Route path="/gorras/:slug" element={<Producto />} />
      <Route path="/carrito" element={<Carrito />} />
      <Route path="/ingresar" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route element={<RutaProtegida />}>
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/pedido/:codigo/confirmado" element={<ConfirmacionPedido />} />
        <Route path="/mis-pedidos" element={<MisPedidos />} />
        <Route element={<RutaAdmin />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />}/><Route path="productos" element={<ProductosAdmin />}/><Route path="inventario" element={<InventarioAdmin />}/><Route path="pedidos" element={<PedidosAdmin />}/><Route path="usuarios" element={<PersonasAdmin />}/><Route path="clientes" element={<PersonasAdmin clientes />}/>
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<main><h1>Página no encontrada</h1><a href="/">Volver al inicio</a></main>} />
    </Route></Routes>
  );
}
