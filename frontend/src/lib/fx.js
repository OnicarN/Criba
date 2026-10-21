// Efectos de pantalla: sacudidas, destellos, ráfagas de partículas y avisos.
// Todos se anulan si la persona prefiere movimiento reducido.

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const shell = () => document.querySelector('.app-shell');

/** Sacude la pantalla. intensity: 'soft' | 'medium' | 'hard' | 'quake' */
export function shake(intensity = 'medium') {
  if (reducedMotion()) return;
  const el = shell();
  if (!el) return;
  const cfg = {
    soft: { amp: 4, rot: 0.2, steps: 6, dur: 320 },
    medium: { amp: 9, rot: 0.5, steps: 9, dur: 480 },
    hard: { amp: 16, rot: 1, steps: 12, dur: 620 },
    quake: { amp: 26, rot: 1.8, steps: 18, dur: 900 },
  }[intensity] || { amp: 9, rot: 0.5, steps: 9, dur: 480 };
  const frames = [];
  for (let i = 0; i < cfg.steps; i++) {
    const decay = 1 - i / cfg.steps;
    const x = (Math.random() * 2 - 1) * cfg.amp * decay;
    const y = (Math.random() * 2 - 1) * cfg.amp * 0.6 * decay;
    const r = (Math.random() * 2 - 1) * cfg.rot * decay;
    frames.push({ transform: `translate3d(${x}px, ${y}px, 0) rotate(${r}deg)` });
  }
  frames.push({ transform: 'none' });
  el.animate(frames, { duration: cfg.dur, easing: 'cubic-bezier(.36,.07,.19,.97)' });
}

/** Sacudida horizontal de un elemento concreto (p. ej. un formulario con error). */
export function nudge(el) {
  if (!el || reducedMotion()) return;
  el.animate(
    [0, -14, 12, -9, 7, -4, 2, 0].map((x) => ({ transform: `translateX(${x}px)` })),
    { duration: 520, easing: 'ease-out' },
  );
}

/** Destello de color a pantalla completa. */
export function flash(color = 'rgba(242,233,78,.35)') {
  if (reducedMotion()) return;
  const d = document.createElement('div');
  d.className = 'flash';
  d.style.background = color;
  document.body.appendChild(d);
  d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: 'ease-out' }).onfinish = () => d.remove();
}

/** Ráfaga de puntos (la "malla" de Criba) desde un punto o un elemento. */
export function burst(origin, { count = 26, colors = ['#0E5C63', '#F2E94E', '#1B7A50', '#14202B'], spread = 220, gravity = true } = {}) {
  if (reducedMotion()) return;
  let x, y;
  if (origin instanceof Element) {
    const r = origin.getBoundingClientRect();
    x = r.left + r.width / 2; y = r.top + r.height / 2;
  } else ({ x, y } = origin);
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 5 + Math.random() * 9;
    p.style.width = p.style.height = `${size}px`;
    p.style.left = `${x - size / 2}px`;
    p.style.top = `${y - size / 2}px`;
    p.style.background = colors[i % colors.length];
    document.body.appendChild(p);
    const angle = Math.random() * Math.PI * 2;
    const dist = spread * (0.35 + Math.random() * 0.65);
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const fall = gravity ? 160 + Math.random() * 120 : 0;
    p.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.8}px, ${dy * 0.8}px) scale(1)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy + fall}px) scale(.3)`, opacity: 0 },
    ], { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => p.remove();
  }
}

/** Onda expansiva desde un punto. */
export function shockwave(origin, color = '#0E5C63') {
  if (reducedMotion()) return;
  let x, y;
  if (origin instanceof Element) {
    const r = origin.getBoundingClientRect();
    x = r.left + r.width / 2; y = r.top + r.height / 2;
  } else ({ x, y } = origin);
  const ring = document.createElement('div');
  ring.className = 'particle';
  Object.assign(ring.style, { left: `${x - 20}px`, top: `${y - 20}px`, width: '40px', height: '40px', border: `3px solid ${color}`, background: 'transparent' });
  document.body.appendChild(ring);
  ring.animate([{ transform: 'scale(0.2)', opacity: 0.9 }, { transform: 'scale(9)', opacity: 0 }], { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => ring.remove();
}

/** Golpe completo: sacudida + onda + partículas. */
export function impact(origin, kind = 'ok') {
  const palette = kind === 'bad'
    ? ['#B23A2B', '#14202B', '#8A979F']
    : ['#0E5C63', '#F2E94E', '#1B7A50', '#14202B'];
  shake(kind === 'bad' ? 'hard' : 'medium');
  shockwave(origin, kind === 'bad' ? '#B23A2B' : '#0E5C63');
  burst(origin, { colors: palette, count: kind === 'bad' ? 34 : 28 });
}

// ---- Avisos (toasts) ----
let toastListener = null;
export function onToast(fn) { toastListener = fn; }
export function toast(message, kind = 'ok') { toastListener?.({ id: Math.random().toString(36).slice(2), message, kind }); }

/** Efecto de onda en botones. */
export function ripple(e) {
  const btn = e.currentTarget;
  if (reducedMotion() || !btn) return;
  const r = btn.getBoundingClientRect();
  const size = Math.max(r.width, r.height) * 2.2;
  const s = document.createElement('span');
  s.className = 'ripple';
  s.style.width = s.style.height = `${size}px`;
  s.style.left = `${(e.clientX || r.left + r.width / 2) - r.left - size / 2}px`;
  s.style.top = `${(e.clientY || r.top + r.height / 2) - r.top - size / 2}px`;
  btn.appendChild(s);
  setTimeout(() => s.remove(), 700);
}
