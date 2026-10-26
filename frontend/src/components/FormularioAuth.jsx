import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { validarAuth } from '../utils/validarAuth.js';
import { NOMBRE_TIENDA } from '../utils/constantes.js';
import styles from './FormularioAuth.module.css';

export default function FormularioAuth({ registro = false }) {
  const { usuario, cargando, ingresar, registrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const reduced = useReducedMotion();
  const [values, setValues] = useState({ nombre: '', email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [serverFields, setServerFields] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [visible, setVisible] = useState(false);
  const errors = { ...validarAuth(values, registro), ...serverFields };

  if (cargando) return <main role="status">Recuperando tu sesión…</main>;
  if (usuario) return <Navigate to={usuario.rol === 'admin' ? '/admin' : '/'} replace />;

  async function submit(event) {
    event.preventDefault();
    if (enviando) return;
    setTouched({ nombre: true, email: true, password: true });
    setServerFields({});
    setError('');
    if (Object.keys(validarAuth(values, registro)).length) return;
    setEnviando(true);
    try {
      const datos = { email: values.email.trim(), password: values.password, ...(registro ? { nombre: values.nombre.trim() } : {}) };
      const actual = await (registro ? registrar(datos) : ingresar(datos));
      const desde = location.state?.desde;
      const destino = typeof desde === 'string' && desde.startsWith('/') && !desde.startsWith('//')
        && (!desde.startsWith('/admin') || actual.rol === 'admin') ? desde : actual.rol === 'admin' ? '/admin' : '/';
      navigate(destino, { replace: true });
    } catch (failure) {
      setError(failure.message);
      setServerFields(Object.fromEntries((failure.detalles || []).map(({ campo, mensaje }) => [campo.split('.').at(-1), mensaje])));
    } finally { setEnviando(false); }
  }

  function field(nombre, label, type, autocomplete, maxLength) {
    const invalid = touched[nombre] && errors[nombre];
    return <div className={styles.field}>
      <label htmlFor={nombre}>{label}</label>
      <div className={styles.inputWrap}>
        <input id={nombre} name={nombre} type={nombre === 'password' && visible ? 'text' : type}
          autoComplete={autocomplete} maxLength={maxLength} value={values[nombre]} required disabled={enviando}
          aria-invalid={Boolean(invalid)} aria-describedby={[nombre === 'password' && registro ? 'password-ayuda' : '', invalid ? `${nombre}-error` : ''].filter(Boolean).join(' ') || undefined}
          onBlur={() => setTouched((prev) => ({ ...prev, [nombre]: true }))}
          onChange={(event) => {
            setValues((prev) => ({ ...prev, [nombre]: event.target.value }));
            setTouched((prev) => ({ ...prev, [nombre]: true }));
            setServerFields((prev) => {
              const siguiente = { ...prev };
              delete siguiente[nombre];
              return siguiente;
            });
          }} />
        {nombre === 'password' && <button className={styles.reveal} type="button" aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? 'Ocultar' : 'Mostrar'}</button>}
      </div>
      {nombre === 'password' && registro && <p id="password-ayuda" className={styles.help}>Al menos 8 caracteres, una letra y un número. Máximo 72 bytes.</p>}
      {invalid && <p id={`${nombre}-error`} className={styles.fieldError} aria-live="polite">{invalid}</p>}
    </div>;
  }

  return <main className={styles.layout}>
    <section className={styles.story} aria-label={`Estilo ${NOMBRE_TIENDA}`}>
      <span className={styles.edition}>DESDE GUATEMALA / PARA TU DÍA</span>
      <div><p className={styles.kicker}>Tu próxima versión.</p><h1>Con la frente<br />en alto<span>.</span></h1><p>Tu estilo tiene una historia.<br />Hazla tuya con {NOMBRE_TIENDA}.</p></div>
      <div className={styles.seal} aria-hidden="true">V<span>ESTILO PROPIO ↗</span></div>
      <span className={styles.bottom}>Una actitud. Muchas formas de llevarla.</span>
    </section>
    <motion.section className={styles.formPanel} initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }} aria-labelledby="form-titulo">
      <p className={styles.step}>{registro ? 'TU ESTILO, TU CUENTA' : 'QUÉ BUENO TENERTE AQUÍ'}</p>
      <h2 id="form-titulo">{registro ? 'Hazte parte.' : 'De vuelta a lo tuyo.'}</h2>
      <p className={styles.description}>{registro ? 'Crea tu cuenta y prepárate para encontrar tu próxima gorra.' : 'Ingresa para continuar con tu cuenta.'}</p>
      <form onSubmit={submit} noValidate aria-busy={enviando}>
        {registro && field('nombre', 'Tu nombre', 'text', 'name', 100)}
        {field('email', 'Correo electrónico', 'email', 'email', 150)}
        {field('password', 'Contraseña', 'password', registro ? 'new-password' : 'current-password', registro ? 72 : 256)}
        {error && <p className={styles.alert} role="alert">{error}</p>}
        <button className={styles.submit} type="submit" disabled={enviando}>{enviando ? 'Un momento…' : registro ? 'Crear mi cuenta' : 'Ingresar'}<span aria-hidden="true">↗</span></button>
      </form>
      <p className={styles.switch}>{registro ? '¿Ya tienes cuenta?' : '¿Primera vez por aquí?'} <Link to={registro ? '/ingresar' : '/registro'} state={location.state}>{registro ? 'Ingresa' : 'Crea tu cuenta'}</Link></p>
      <Link className={styles.back} to="/">← Volver al inicio</Link>
    </motion.section>
  </main>;
}
