import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Carrito.module.css';

export function ToastMensaje({mensaje,accion,cerrar,dentro=false,tipo='exito'}){
  const [ocupado,setOcupado]=useState(false),[error,setError]=useState('');
  useEffect(()=>{setError('');setOcupado(false);},[mensaje]);
  return <div className={`${styles.toast} ${dentro?styles.toastDentro:''}`} role={tipo==='error'?'alert':'status'}><p>{error||mensaje}</p>{accion&&<button disabled={ocupado} onClick={async()=>{setOcupado(true);try{await accion();}catch(e){setError(e.message);}finally{setOcupado(false);}}}>{ocupado?'Restaurando…':'Deshacer'}</button>}<button aria-label="Cerrar aviso" onClick={cerrar}>✕</button></div>;
}

export default function Notificaciones(){
  const [aviso,setAviso]=useState(null),[modal,setModal]=useState(null);
  useEffect(()=>{const recibir=(event)=>{setModal(document.querySelector('dialog[open]'));setAviso({...event.detail,id:Date.now()});};window.addEventListener('visera:aviso',recibir);return()=>window.removeEventListener('visera:aviso',recibir);},[]);
  useEffect(()=>{
    if(!aviso)return;
    const timer=setTimeout(()=>setAviso(null),6500);
    const observer=new MutationObserver(()=>setModal(document.querySelector('dialog[open]')));
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['open']});
    return()=>{clearTimeout(timer);observer.disconnect();};
  },[aviso]);
  return aviso?createPortal(<ToastMensaje {...aviso} dentro={Boolean(modal)} cerrar={()=>setAviso(null)}/>,modal||document.body):null;
}
