import { useEffect, useId, useRef, useState } from 'react';
import { solicitar } from '../../api/cliente.js';
import styles from './Admin.module.css';

export function useAccion(){
  const [ocupado,setOcupado]=useState(false),[error,setError]=useState(''),[mensaje,setMensaje]=useState('');
  const bloqueo=useRef(false);
  async function mutar(ruta,method,body){if(bloqueo.current)return null;bloqueo.current=true;setOcupado(true);setError('');setMensaje('');try{const data=await solicitar(ruta,{method,body});setMensaje('Cambios guardados correctamente.');return data;}catch(e){setError(e.message);return null;}finally{bloqueo.current=false;setOcupado(false);}}
  return {ocupado,error,mensaje,mutar};
}
export function Feedback({accion}){return <>{accion.error&&<p className={styles.error} role="alert">{accion.error}</p>}{accion.mensaje&&<p className={styles.notice} role="status">{accion.mensaje}</p>}</>;}
export function Estado({recurso,children,vacio}){if(recurso.cargando)return <div className={styles.loading} role="status"><span>Cargando información…</span></div>;if(recurso.error)return <div className={styles.error} role="alert">{recurso.error}<button onClick={recurso.recargar}>Reintentar</button></div>;if(vacio)return <p className={styles.empty}>No hay resultados. Prueba otra búsqueda o agrega datos.</p>;return children;}
export function Tabla({label,headers,children}){return <div className={styles.table} role="region" aria-label={label} tabIndex={0}><table><thead><tr>{headers.map((h)=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;}
export function Buscar({onBuscar}){return <form onSubmit={(e)=>{e.preventDefault();onBuscar(new FormData(e.currentTarget).get('buscar').trim());}}><label className="soloLectores" htmlFor="admin-buscar">Buscar</label><input id="admin-buscar" name="buscar" placeholder="Buscar por nombre…" maxLength={100}/><button>Buscar</button></form>;}
export function ModalAdmin({titulo,cerrar,children}){
  const ref=useRef(null),id=useId();
  useEffect(()=>{const node=ref.current;node.showModal();return()=>node.close();},[]);
  function tab(e){if(e.key!=='Tab')return;const list=[...ref.current.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])')].filter((n)=>n.getClientRects().length);if(e.shiftKey&&document.activeElement===list[0]){e.preventDefault();list.at(-1)?.focus();}else if(!e.shiftKey&&document.activeElement===list.at(-1)){e.preventDefault();list[0]?.focus();}}
  return <dialog ref={ref} className={styles.modal} aria-labelledby={id} onClose={cerrar} onKeyDown={tab}><header><h2 id={id}>{titulo}</h2><button type="button" onClick={cerrar} aria-label="Cerrar panel">✕</button></header>{children}</dialog>;
}
