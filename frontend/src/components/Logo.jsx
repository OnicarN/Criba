import { motion } from 'framer-motion';

const DOTS = [[9, 9], [17, 9], [25, 9], [9, 17], [25, 17], [9, 25], [17, 25], [25, 25]];

/** Símbolo de Criba: malla de 8 puntos y el punto amarillo que pasa la criba. */
export function LogoMark({ size = 34, animate = false, loop = false, title }) {
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true };
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" {...a11y}>
      <rect width="34" height="34" rx="10" fill="#0E5C63" />
      {DOTS.map(([cx, cy], i) => (
        <motion.circle
          key={i} cx={cx} cy={cy} r="2.6" fill="#F3F5F4"
          initial={animate ? { scale: 0, opacity: 0 } : false}
          animate={animate ? { scale: loop ? [1, 0.55, 1] : 1, opacity: 1 } : undefined}
          transition={animate ? (loop
            ? { duration: 1.2, repeat: Infinity, delay: i * 0.09, ease: 'easeInOut' }
            : { type: 'spring', stiffness: 500, damping: 18, delay: 0.05 * i }) : undefined}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
      ))}
      <motion.circle
        cx="17" cy="17" r="3.4" fill="#F2E94E"
        initial={animate ? { y: -22, opacity: 0 } : false}
        animate={animate ? (loop ? { y: [-22, 0, 0, 22], opacity: [0, 1, 1, 0] } : { y: 0, opacity: 1 }) : undefined}
        transition={animate ? (loop
          ? { duration: 1.8, repeat: Infinity, times: [0, 0.35, 0.7, 1], ease: 'easeInOut' }
          : { type: 'spring', stiffness: 380, damping: 14, delay: 0.5 }) : undefined}
      />
    </svg>
  );
}

export function Logo({ animate = false }) {
  return (
    <>
      <LogoMark animate={animate} title="Criba" />
      <span aria-hidden="true">Criba</span>
    </>
  );
}
