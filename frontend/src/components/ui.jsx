import { animate, motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { reducedMotion, ripple } from '../lib/fx.js';
import { Check, Cross, Info } from './Icons.jsx';

/** Botón con onda al pulsar y efecto magnético (sigue un poco al cursor). */
export const Button = forwardRef(function Button(
  { variant = 'primary', size, magnetic = false, to, href, className = '', onClick, children, ...rest }, ref,
) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 260, damping: 16 });
  const sy = useSpring(y, { stiffness: 260, damping: 16 });
  const cls = `btn btn-${variant} ${size ? `btn-${size}` : ''} ${className}`.trim();

  const onMove = (e) => {
    if (!magnetic || reducedMotion()) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.28);
    y.set((e.clientY - r.top - r.height / 2) * 0.38);
  };
  const reset = () => { x.set(0); y.set(0); };
  const handle = (e) => { ripple(e); onClick?.(e); };
  const common = {
    className: cls, onMouseMove: onMove, onMouseLeave: reset, onClick: handle, style: { x: sx, y: sy },
    whileTap: { scale: 0.96 }, ref, ...rest,
  };
  if (to) return <MotionLink to={to} {...common}>{children}</MotionLink>;
  if (href) return <motion.a href={href} {...common}>{children}</motion.a>;
  return <motion.button type="button" {...common}>{children}</motion.button>;
});

const MotionLink = motion.create(Link);

/** Aparece al entrar en pantalla. */
export function Reveal({ children, delay = 0, y = 28, as = 'div', className, style, once = true, ...rest }) {
  const M = motion[as];
  return (
    <M
      className={className}
      style={style}
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration: 0.75, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </M>
  );
}

/** Cifra que cuenta hasta su valor. */
export function CountUp({ value, duration = 1.2, className, start = true }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [shown, setShown] = useState(reducedMotion() ? value : 0);
  useEffect(() => {
    if (!inView || !start) return undefined;
    if (reducedMotion()) { setShown(value); return undefined; }
    const c = animate(0, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: (v) => setShown(Math.round(v)) });
    return () => c.stop();
  }, [inView, value, duration, start]);
  return <span ref={ref} className={className}>{shown}</span>;
}

/** Tarjeta que se inclina en 3D siguiendo al cursor. */
export function Tilt({ children, className, max = 8, style, ...rest }) {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [max, -max]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-max, max]), { stiffness: 200, damping: 18 });
  const onMove = (e) => {
    if (reducedMotion()) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  return (
    <motion.div
      className={className}
      onMouseMove={onMove}
      onMouseLeave={() => { mx.set(0.5); my.set(0.5); }}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d', ...style }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function Score({ value, animateIn = true }) {
  return (
    <span className="score">
      <span className="score-num">{animateIn ? <CountUp value={value} duration={1} /> : value}</span>
      <span className="score-bar" aria-hidden="true">
        <motion.span
          initial={animateIn ? { scaleX: 0 } : false}
          animate={{ scaleX: value / 100 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </span>
    </span>
  );
}

export const REC_LABEL = { AVANZAR: 'Avanzar', REVISAR: 'Revisar', DESCARTAR: 'Descartar' };

export function RecBadge({ value }) {
  if (value === 'AVANZAR') return <span className="rec rec-ok"><Check />Avanzar</span>;
  if (value === 'DESCARTAR') return <span className="rec rec-bad"><Cross />Descartar</span>;
  return <span className="rec rec-review">Revisar</span>;
}

export function ErrorAlert({ error, children }) {
  if (!error && !children) return null;
  return (
    <motion.div
      className="alert alert-error" role="alert"
      initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
    >
      <Cross color="var(--bad-text)" />
      <div>
        {children || <><strong>{error.message}</strong>{error.hint && <> {error.hint}</>}</>}
      </div>
    </motion.div>
  );
}

export function InfoNote({ children, className = '' }) {
  return <div className={`alert alert-info ${className}`}><Info /><div>{children}</div></div>;
}

/** Anillo de puntuación del informe. */
export function ScoreRing({ value }) {
  const r = 27;
  const c = 2 * Math.PI * r;
  return (
    <svg className="ring" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--line-soft)" strokeWidth="7" />
      <motion.circle
        cx="32" cy="32" r={r} fill="none" stroke="var(--primary)" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c} transform="rotate(-90 32 32)"
        initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value / 100) }}
        transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}
