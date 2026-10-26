import { useEffect, useId, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './PanelMovil.module.css';

export default function PanelMovil({ titulo, boton, children, className = '' }) {
  const dialog = useRef(null);
  const id = useId();
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (dialog.current?.open) dialog.current.close();
  }, [pathname, search]);
  useEffect(() => () => { document.body.style.overflow = ''; }, []);
  return <span className={className}>
    <button type="button" className={styles.trigger} aria-haspopup="dialog" onClick={() => {
      dialog.current.showModal(); document.body.style.overflow = 'hidden';
    }}>{boton}</button>
    <dialog ref={dialog} className={styles.panel} aria-labelledby={id} onClose={() => { document.body.style.overflow = ''; }} onClick={(event) => { if (event.target === event.currentTarget) dialog.current.close(); }}>
      <div className={styles.top}><h2 id={id}>{titulo}</h2><button type="button" autoFocus aria-label={`Cerrar ${titulo.toLowerCase()}`} onClick={() => dialog.current.close()}>✕</button></div>
      <div className={styles.body} onSubmit={() => dialog.current.close()} onClick={(event) => {
        if (event.target.closest('a[href]')) dialog.current.close();
      }}>{children}</div>
    </dialog>
  </span>;
}
