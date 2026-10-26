import { useEffect, useId } from 'react';
import { motion, useAnimation, useReducedMotion } from 'framer-motion';
import styles from './CapSvg.module.css';

const siluetas = {
  snapback: 'M78 172C75 92 116 52 180 53c70 0 102 52 103 116-65 28-136 30-205 3Z',
  dad: 'M75 176C79 101 121 65 181 64c65 0 102 46 105 111-66 27-141 26-211 1Z',
  trucker: 'M76 173C76 88 120 48 181 50c67 0 105 49 106 122-70 28-140 30-211 1Z',
  bucket: 'M94 169 113 74q67-29 134 0l21 95Z',
  beanie: 'M92 179C87 104 121 47 180 46c60 0 93 57 88 133Z',
};

export default function CapSvg({ color = '#1F6F54', estilo = 'snapback', tamano = '100%', className = '' }) {
  const id = useId().replace(/:/g, '');
  const controls = useAnimation();
  const reduced = useReducedMotion();
  const forma = siluetas[estilo] || siluetas.snapback;
  const sinVisera = estilo === 'bucket' || estilo === 'beanie';
  useEffect(() => {
    if (!reduced) controls.start({ y: [0, -4, 0], transition: { duration: .3 } });
  }, [color, controls, reduced]);

  return <motion.svg animate={controls} width={tamano} viewBox="0 0 360 280" className={`${styles.cap} ${className}`} role="img" aria-label={`Gorra estilo ${estilo}`}>
    <defs>
      <linearGradient id={`${id}-luz`} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor="white" stopOpacity=".28" /><stop offset=".4" stopColor="white" stopOpacity="0" /><stop offset="1" stopColor="black" stopOpacity=".3" />
      </linearGradient>
      <radialGradient id={`${id}-sombra`}><stop stopColor="#14110F" stopOpacity=".22" /><stop offset="1" stopColor="#14110F" stopOpacity="0" /></radialGradient>
      <pattern id={`${id}-malla`} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1" fill="#14110F" opacity=".3" /></pattern>
    </defs>
    <ellipse cx="184" cy="237" rx="138" ry="22" fill={`url(#${id}-sombra)`} />
    <path d={forma} fill={color} className={styles.color} />
    <path d={forma} fill={`url(#${id}-luz)`} />
    {estilo === 'trucker' && <path d="M184 54c58 2 99 52 102 116l-78 13c7-60-2-100-24-129Z" fill={`url(#${id}-malla)`} />}
    {sinVisera ? estilo === 'bucket' ? <>
      <path d="M94 160 54 210q124 48 252-1l-39-49q-88 23-173 0Z" fill={color} className={styles.color} />
      <path d="M94 160 54 210q124 48 252-1l-39-49q-88 23-173 0Z" fill={`url(#${id}-luz)`} />
      <path d="M87 181q96 26 188-1M74 198q106 32 215-1" fill="none" stroke="white" strokeOpacity=".2" strokeDasharray="3 3" />
    </> : <>
      {Array.from({ length: 11 }, (_, index) => <path key={index} d={`M${106 + index * 15} 166Q${108 + index * 14} 85 ${155 + index * 5} 55`} fill="none" stroke="white" strokeOpacity=".15" strokeWidth="3" />)}
      <rect x="88" y="153" width="184" height="58" rx="12" fill={color} className={styles.color} />
      <rect x="88" y="153" width="184" height="58" rx="12" fill={`url(#${id}-luz)`} />
    </> : <>
      <path d={estilo === 'dad' ? 'M77 169q113 29 209 0l45 31q-119 63-249 18L43 197Z' : 'M78 164q105 26 206 0l51 38q-128 49-262 8L42 189Z'} fill={color} className={styles.color} />
      <path d={estilo === 'dad' ? 'M77 169q113 29 209 0l45 31q-119 63-249 18L43 197Z' : 'M78 164q105 26 206 0l51 38q-128 49-262 8L42 189Z'} fill={`url(#${id}-luz)`} />
      <path d="M179 57q-28 53-24 115M182 57q43 47 48 115" fill="none" stroke="white" strokeOpacity=".25" strokeDasharray="3 3" />
      <ellipse cx="180" cy={estilo === 'dad' ? 65 : 53} rx="10" ry="5" fill={color} className={styles.color} />
    </>}
    <path d={estilo === 'beanie' ? 'M164 168h32v28h-32Z' : 'M143 110h36v28h-36Z'} fill="#F6F1E7" opacity=".95" />
    <path d={estilo === 'beanie' ? 'm171 176 9 12 9-12' : 'm151 118 10 12 10-12'} fill="none" stroke="#14110F" strokeWidth="3" />
  </motion.svg>;
}
