import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { ItemsPedido, TotalesPedido } from '../../components/DetallePedido.jsx';
import { validarDatos, validarTarjeta, marcaTarjeta } from '../../utils/checkout.js';
import styles from '../../components/Pedidos.module.css';

const campos = [
  ['nombre_destinatario', 'Nombre del destinatario', 'name', 100],
  ['telefono_contacto', 'Teléfono de contacto', 'tel', 20],
  ['direccion_envio', 'Dirección de entrega', 'street-address', 255],
  ['ciudad', 'Ciudad', 'address-level2', 80],
  ['notas', 'Notas de entrega (opcional)', 'off', 255],
];

export default function Checkout() {
  const { usuario } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const titulo = useRef(null);
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState({ nombre_destinatario: usuario.nombre, telefono_contacto: usuario.telefono || '', direccion_envio: '', ciudad: '', notas: '' });
  const [metodo, setMetodo] = useState('contra_entrega');
  const [tarjeta, setTarjeta] = useState({ numero: '', fecha: '' });
  const [pago, setPago] = useState(null);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const errores = paso === 0 ? validarDatos(datos) : validarTarjeta(tarjeta.numero, tarjeta.fecha);
  useEffect(() => { titulo.current?.focus(); }, [paso]);

  async function continuar(event) {
    event.preventDefault();
    if (cart.ocupado) return;
    setError('');
    if (paso === 0) {
      setTouched(Object.fromEntries(campos.map(([nombre]) => [nombre, true])));
      if (!Object.keys(validarDatos(datos)).length) setPaso(1);
      return;
    }
    if (paso === 1) {
      setTouched({ numero: true, fecha: true });
      if (metodo === 'tarjeta' && Object.keys(validarTarjeta(tarjeta.numero, tarjeta.fecha)).length) return;
      setPago({ metodo_pago: metodo, pago_marca: metodo === 'tarjeta' ? marcaTarjeta(tarjeta.numero) : null,
        pago_ultimos4: metodo === 'tarjeta' ? tarjeta.numero.replace(/\D/g, '').slice(-4) : null });
      setTarjeta({ numero: '', fecha: '' });
      setPaso(2);
      return;
    }
    try {
      const pedido = await cart.comprar({ ...Object.fromEntries(Object.entries(datos).map(([campo, valor]) => [campo, valor.trim()])), ...pago });
      navigate(`/pedido/${pedido.codigo}/confirmado`, { replace: true });
    } catch (failure) {
      if (failure.status === 409) navigate('/carrito', { replace: true, state: { errorStock: failure.message } });
      else setError(failure.message);
    }
  }

  function errorCampo(nombre) {
    return touched[nombre] && errores[nombre] ? <p id={`${nombre}-error`} className={styles.fieldError} aria-live="polite">{errores[nombre]}</p> : null;
  }

  if (usuario.rol !== 'cliente') return <main><h1>Compra con tu cuenta de cliente.</h1><Link to="/gorras">Ver gorras</Link></main>;
  if (cart.cargando) return <main role="status">{cart.error ? <><p role="alert">{cart.error}</p><button onClick={cart.recargar}>Actualizar carrito</button></> : 'Preparando tu pedido…'}</main>;
  if (!cart.items.length) return <main className={styles.page}><div className={styles.empty}><h1>Primero, encuentra tu gorra.</h1><p>Tu carrito está vacío.</p><Link className={styles.secondary} to="/gorras">Ver gorras ↗</Link></div></main>;

  return <main className={styles.page}><p className={styles.eyebrow}>ESTÁS A UN PASO DE TU ESTILO</p><h1>Hazla tuya.</h1>
    <ol className={styles.steps} aria-label="Pasos de compra">{['Datos', 'Pago', 'Confirmar'].map((texto, index) => <li key={texto} aria-current={paso === index ? 'step' : undefined}>{index + 1}. {texto}</li>)}</ol>
    <div className={styles.aviso}>Pago de demostración, no se realizará ningún cargo</div>
    <div className={styles.layout}><form className={styles.form} onSubmit={continuar} noValidate aria-busy={cart.ocupado}>
      <motion.section key={paso} initial={reduced ? false : { opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .18 }}>
        <h2 ref={titulo} tabIndex={-1}>{['¿A dónde va tu gorra?', 'Elige cómo pagar', 'Revisa tu pedido'][paso]}</h2>
        <fieldset disabled={cart.ocupado}>
          {paso === 0 && campos.map(([nombre, label, autocomplete, max]) => <div className={styles.field} key={nombre}><label htmlFor={nombre}>{label}</label>
            {nombre === 'notas' ? <textarea id={nombre} name={nombre} maxLength={max} value={datos[nombre]} onChange={(e) => { setDatos({ ...datos, [nombre]: e.target.value }); setTouched({ ...touched, [nombre]: true }); }} aria-invalid={Boolean(touched[nombre] && errores[nombre])} aria-describedby={touched[nombre] && errores[nombre] ? `${nombre}-error` : undefined} />
              : <input id={nombre} name={nombre} type={nombre === 'telefono_contacto' ? 'tel' : 'text'} autoComplete={autocomplete} maxLength={max} required value={datos[nombre]} onChange={(e) => { setDatos({ ...datos, [nombre]: e.target.value }); setTouched({ ...touched, [nombre]: true }); }} onBlur={() => setTouched({ ...touched, [nombre]: true })} aria-invalid={Boolean(touched[nombre] && errores[nombre])} aria-describedby={touched[nombre] && errores[nombre] ? `${nombre}-error` : undefined} />}
            {errorCampo(nombre)}</div>)}
          {paso === 1 && <><div className={styles.metodos}>{[['contra_entrega', 'Contra entrega'], ['tarjeta', 'Tarjeta de demostración']].map(([value, label]) => <label key={value}><input type="radio" name="metodo_pago" value={value} checked={metodo === value} onChange={() => { setMetodo(value); setTarjeta({ numero: '', fecha: '' }); setTouched({}); }} />{label}</label>)}</div>
            {metodo === 'tarjeta' && <><p className={styles.nota}>Visa y Mastercard · Validación de demostración.</p><div className={styles.field}><label htmlFor="numero">Número de tarjeta de prueba</label><input id="numero" inputMode="numeric" autoComplete="cc-number" maxLength={23} value={tarjeta.numero} onChange={(e) => { setTarjeta({ ...tarjeta, numero: e.target.value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim() }); setTouched({ ...touched, numero: true }); }} aria-invalid={Boolean(touched.numero && errores.numero)} aria-describedby={touched.numero && errores.numero ? 'numero-error' : undefined} />{errorCampo('numero')}</div>
              <div className={styles.field}><label htmlFor="fecha">Vencimiento (MM/AA)</label><input id="fecha" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" maxLength={5} value={tarjeta.fecha} onChange={(e) => { const digits = e.target.value.replace(/\D/g, '').slice(0, 4); setTarjeta({ ...tarjeta, fecha: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits }); setTouched({ ...touched, fecha: true }); }} aria-invalid={Boolean(touched.fecha && errores.fecha)} aria-describedby={touched.fecha && errores.fecha ? 'fecha-error' : undefined} />{errorCampo('fecha')}</div></>}
          </>}
          {paso === 2 && <div className={styles.datos}><h3>Entrega a {datos.nombre_destinatario}</h3><p>{datos.direccion_envio}, {datos.ciudad}</p><p>{datos.telefono_contacto}</p>{datos.notas && <p>{datos.notas}</p>}<h3>Pago</h3><p>{pago?.metodo_pago === 'tarjeta' ? `${pago.pago_marca === 'visa' ? 'Visa' : 'Mastercard'} ···· ${pago.pago_ultimos4}` : 'Contra entrega'}</p><p className={styles.nota}>Confirma que tus datos son correctos. Los importes se comprueban al confirmar.</p></div>}
        </fieldset>
      </motion.section>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.actions}>{paso > 0 && <button className={styles.secondary} type="button" disabled={cart.ocupado} onClick={() => { setPaso(paso - 1); setTouched({}); }}>← Atrás</button>}<button type="submit" disabled={cart.ocupado}>{cart.ocupado ? 'Confirmando…' : paso === 2 ? 'Confirmar pedido' : 'Continuar →'}</button></div>
      <Link className={styles.secondary} to="/carrito">Volver al carrito</Link>
    </form><aside className={styles.resumen} aria-label="Resumen de compra"><h2>Tu elección.</h2><ItemsPedido items={cart.items} /><TotalesPedido {...cart} /></aside></div>
  </main>;
}
