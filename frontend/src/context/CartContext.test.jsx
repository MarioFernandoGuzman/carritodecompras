import { useState } from 'react';
import { beforeAll, afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CartContext, cartReducer, calcularTotales } from './CartContext.jsx';
import CartDrawer from '../components/CartDrawer.jsx';

beforeAll(() => {
  vi.stubGlobal('matchMedia', () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); this.dispatchEvent(new Event('close')); };
});
afterEach(cleanup);

const gorra = { varianteId: 1, id: 1, nombre: 'Snapback Volcán', slug: 'snapback-volcan', color_nombre: 'Negro', color_hex: '#14110F', talla: 'L/XL', estilo: 'snapback', precio_unitario: '149.00', cantidad: 1, stock: 3, subtotal: '149.00' };

test('el reducer y los totales suman, modifican, eliminan e hidratan sin errores de redondeo', () => {
  const item = { ...gorra, precio_unitario: '19.99' };
  let state = cartReducer([], { type: 'agregar', item });
  state = cartReducer(state, { type: 'agregar', item });
  expect(calcularTotales(state)).toEqual({ subtotal: 39.98, cantidadTotal: 2 });
  state = cartReducer(state, { type: 'modificar', varianteId: 1, cantidad: 3 });
  state = cartReducer(state, { type: 'agregar', item: { ...gorra, varianteId: 2 } });
  expect(calcularTotales(state)).toEqual({ subtotal: 208.97, cantidadTotal: 4 });
  state = cartReducer(state, { type: 'eliminar', varianteId: 1 });
  expect(calcularTotales(state)).toEqual({ subtotal: 149, cantidadTotal: 1 });
  state = cartReducer(state, { type: 'hidratar', items: [{ ...gorra, cantidad: 2 }] });
  expect(calcularTotales(state)).toEqual({ subtotal: 298, cantidadTotal: 2 });
  expect(calcularTotales(cartReducer(state, { type: 'vaciar' }))).toEqual({ subtotal: 0, cantidadTotal: 0 });
});

test('CartDrawer muestra el artículo y el total y permite eliminarlo', async () => {
  const eliminar = vi.fn();
  function Harness() {
    const [items, setItems] = useState([gorra]);
    return <MemoryRouter><CartContext.Provider value={{
      items, cantidadTotal: items.length, abierto: true, cargando: false, ocupado: false, error: '', avisos: [],
      subtotal: '149.00', envio: '25.00', total: '174.00', falta_envio_gratis: '151.00', config: { tarifa: '25.00', gratisDesde: '300.00' },
      cerrar: vi.fn(), recargar: vi.fn(), modificar: vi.fn(), notificacion: null,
      eliminar: async (id) => { eliminar(id); setItems([]); },
    }}><CartDrawer /></CartContext.Provider></MemoryRouter>;
  }
  render(<Harness />);
  expect(screen.getByText('Snapback Volcán')).toBeTruthy();
  expect(screen.getByText('Q 174.00')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar Snapback Volcán' }));
  await waitFor(() => expect(eliminar).toHaveBeenCalledWith(1));
  expect(screen.getByText('Tu carrito está esperando tu estilo.')).toBeTruthy();
});
