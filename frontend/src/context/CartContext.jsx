import { createContext, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { solicitar } from '../api/cliente.js';
import { cartReducer, calcularTotales } from '../utils/cartReducer.js';
import { crearItem, guardarLocal, leerLocal, refrescarLocal, snapshot } from '../utils/carritoLocal.js';

export { cartReducer, calcularTotales } from '../utils/cartReducer.js';
export const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { usuario, cargando: authCargando, errorSesion } = useAuth();
  const propietario = usuario?.id || 'visitante';
  const [items, dispatch] = useReducer(cartReducer, []);
  const actual = useRef([]);
  const local = useRef(null);
  if (local.current === null) local.current = leerLocal();
  const preparacion = useRef(null);
  const ocupadoRef = useRef(false);
  const propietarioRef = useRef(propietario);
  propietarioRef.current = propietario;
  const [listo, setListo] = useState(null);
  const [revision, setRevision] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [avisos, setAvisos] = useState([]);
  const [servidor, setServidor] = useState(null);
  const [config, setConfig] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [pulso, setPulso] = useState(0);
  const [notificacion, setNotificacion] = useState(null);
  const cerrar = useCallback(() => setAbierto(false), []);
  const recargar = useCallback(() => {
    if (!preparacion.current?.pendiente && !ocupadoRef.current) setRevision((r) => r + 1);
  }, []);
  const toast = (mensaje, accion) => setNotificacion({ mensaje, accion, id: Date.now() });

  function hidratar(data) {
    if (propietarioRef.current !== propietario) return;
    actual.current = cartReducer([], { type: 'hidratar', items: data.items });
    dispatch({ type: 'hidratar', items: data.items });
    setServidor(usuario ? data : null);
    setAvisos(data.avisos || []);
  }

  function persistir(nuevos) {
    local.current = snapshot(nuevos);
    if (!guardarLocal(nuevos)) toast('El navegador no permite guardar tu carrito. Se conservará mientras esta página esté abierta.');
  }

  useEffect(() => {
    const controller = new AbortController();
    solicitar('/carrito/configuracion', { signal: controller.signal }).then(setConfig).catch((failure) => {
      if (failure.name !== 'AbortError') setError(failure.message);
    });
    return () => controller.abort();
  }, [revision]);

  useEffect(() => {
    if (authCargando || errorSesion) return;
    let cancelado = false;
    if (listo !== propietario) { setAbierto(false); setNotificacion(null); }
    setListo(null); setError(''); setServidor(null);
    actual.current = []; dispatch({ type: 'vaciar' });
    const clave = `${propietario}:${revision}`;
    if (preparacion.current?.clave !== clave) {
      const promise = (async () => {
        if (usuario?.rol === 'admin') return { items: [], avisos: ['Usa una cuenta de cliente para realizar compras.'] };
        if (!usuario) return refrescarLocal(local.current);
        const pendientes = local.current;
        const data = pendientes.length
          ? await solicitar('/carrito/fusionar', { method: 'POST', body: { items: pendientes.map(({ varianteId, cantidad }) => ({ varianteId, cantidad })) } })
          : await solicitar('/carrito');
        if (local.current === pendientes) { local.current = []; guardarLocal([]); }
        return data;
      })();
      const registro = { clave, promise, pendiente: true };
      preparacion.current = registro;
      promise.then(() => { registro.pendiente = false; }, () => { registro.pendiente = false; });
    }
    // Reutiliza la misma petición durante el montaje doble de StrictMode; no aborta una fusión enviada.
    preparacion.current.promise.then((data) => {
      if (cancelado) return;
      hidratar(data);
      if (!usuario) persistir(data.items);
      setListo(propietario);
    }).catch((failure) => { if (!cancelado) setError(failure.message); });
    return () => { cancelado = true; };
  }, [propietario, authCargando, errorSesion, revision]);

  useEffect(() => {
    const focus = () => { if (!ocupadoRef.current) recargar(); };
    window.addEventListener('focus', focus);
    return () => window.removeEventListener('focus', focus);
  }, [recargar]);

  useEffect(() => {
    if (!notificacion) return;
    const timer = setTimeout(() => setNotificacion(null), 6500);
    return () => clearTimeout(timer);
  }, [notificacion]);

  const cargando = authCargando || listo !== propietario;
  async function ejecutar(operacion) {
    if (cargando || ocupadoRef.current || errorSesion) throw new Error('Espera a que termine la actualización del carrito.');
    if (usuario?.rol === 'admin') throw new Error('Usa una cuenta de cliente para realizar compras.');
    const origen = propietario;
    ocupadoRef.current = true; setOcupado(true); setError('');
    try { return await operacion(); }
    catch (failure) {
      if (propietarioRef.current === origen) {
        if (usuario && failure.status === 409) {
          try { hidratar(await solicitar('/carrito')); } catch { /* Conserva el error original de stock. */ }
        }
        setError(failure.message);
      }
      throw failure;
    } finally { ocupadoRef.current = false; setOcupado(false); }
  }

  async function agregar(item, cantidad = 1, mostrar = true) {
    await ejecutar(async () => {
      const origen = propietario;
      if (usuario) {
        const data = await solicitar('/carrito/items', { method: 'POST', body: { varianteId: item.varianteId, cantidad } });
        if (propietarioRef.current !== origen) return;
        hidratar(data);
      } else {
        const producto = await solicitar(`/productos/${encodeURIComponent(item.slug)}`);
        const variante = producto.variantes.find((v) => v.id === item.varianteId);
        const existente = actual.current.find((i) => i.varianteId === item.varianteId)?.cantidad || 0;
        if (!variante?.stock || existente + cantidad > variante.stock) throw new Error(`Solo hay ${variante?.stock || 0} unidades disponibles de esta variante.`);
        if (actual.current.length >= 100 && !existente) throw new Error('Tu carrito admite hasta 100 variantes diferentes.');
        const nuevos = cartReducer(actual.current, { type: 'agregar', item: crearItem(producto, variante, cantidad) });
        hidratar({ items: nuevos }); persistir(nuevos);
      }
      setPulso((p) => p + 1);
      if (mostrar) { setAbierto(true); toast('Agregaste tu gorra al carrito.'); }
    });
  }

  async function modificar(varianteId, cantidad) {
    await ejecutar(async () => {
      const item = actual.current.find((i) => i.varianteId === varianteId);
      if (!item) return;
      if (usuario) hidratar(await solicitar(`/carrito/items/${item.id}`, { method: 'PATCH', body: { cantidad } }));
      else {
        const fresco = await refrescarLocal(snapshot(actual.current));
        hidratar(fresco); persistir(fresco.items);
        const vigente = fresco.items.find((i) => i.varianteId === varianteId);
        if (!vigente || cantidad > vigente.stock) throw new Error(`Solo hay ${vigente?.stock || 0} unidades disponibles de esta variante.`);
        const nuevos = cartReducer(actual.current, { type: 'modificar', varianteId, cantidad });
        hidratar({ items: nuevos, avisos: fresco.avisos }); persistir(nuevos);
      }
    });
  }

  async function eliminar(varianteId) {
    const item = actual.current.find((i) => i.varianteId === varianteId);
    if (!item) return;
    await ejecutar(async () => {
      if (usuario) hidratar(await solicitar(`/carrito/items/${item.id}`, { method: 'DELETE' }));
      else {
        const nuevos = cartReducer(actual.current, { type: 'eliminar', varianteId });
        hidratar({ items: nuevos }); persistir(nuevos);
      }
      toast(`Eliminaste ${item.nombre}.`, async () => { await agregar(item, item.cantidad, false); setNotificacion(null); });
    });
  }

  async function vaciar() {
    await ejecutar(async () => {
      if (usuario) hidratar(await solicitar('/carrito', { method: 'DELETE' }));
      else { hidratar({ items: cartReducer(actual.current, { type: 'vaciar' }) }); persistir([]); }
      setNotificacion(null);
    });
  }

  async function comprar(datos) {
    return ejecutar(async () => {
      const pedido = await solicitar('/pedidos', { method: 'POST', body: datos });
      hidratar({ items: [], subtotal: '0.00', envio: '0.00', total: '0.00', falta_envio_gratis: config?.gratisDesde ?? null });
      setAbierto(false); setNotificacion(null);
      return pedido;
    });
  }

  const visibles = cargando ? [] : items;
  const totales = calcularTotales(visibles);
  const subtotal = totales.subtotal.toFixed(2);
  const envio = config ? (visibles.length && totales.subtotal < Number(config.gratisDesde) ? config.tarifa : '0.00') : null;
  const resumen = usuario && servidor && !cargando ? servidor : { subtotal, envio,
    total: envio === null ? null : (totales.subtotal + Number(envio)).toFixed(2),
    falta_envio_gratis: config ? Math.max(0, Number(config.gratisDesde) - totales.subtotal).toFixed(2) : null };

  return <CartContext.Provider value={{ ...resumen, items: visibles, cantidadTotal: totales.cantidadTotal, config,
    cargando, ocupado, error, avisos, abierto, pulso, notificacion, agregar, modificar, eliminar, vaciar, comprar, esVisitante: !usuario,
    abrir: () => { setAbierto(true); recargar(); }, cerrar, recargar, descartarToast: () => setNotificacion(null),
  }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('CartProvider es obligatorio.');
  return context;
}
