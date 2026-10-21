import { AnimatePresence, motion, useMotionValue, useScroll, useSpring } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { onToast, reducedMotion } from '../lib/fx.js';
import { Check, Cross, Info } from './Icons.jsx';
import { Logo, LogoMark } from './Logo.jsx';
import { Button } from './ui.jsx';

export function Header() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`}>
      <div className="container header-inner">
        <Link to={user ? '/panel' : '/'} className="brand"><Logo animate /></Link>
        <nav className="nav" aria-label="Principal">
          {user ? (
            <>
              <NavLink to="/panel" className="nav-link" end>Mis vacantes</NavLink>
              <NavLink to="/planes" className="nav-link">Planes</NavLink>
              <span className="account-meta"><strong>{user.companyName}</strong>Plan {user.planLabel}</span>
              <Button variant="secondary" size="sm" onClick={() => logout('/')}>Cerrar sesión</Button>
            </>
          ) : (
            <>
              <NavLink to="/planes" className="nav-link">Planes</NavLink>
              <NavLink to="/entrar" className="nav-link">Iniciar sesión</NavLink>
              <Button to="/registro" size="sm" magnetic>Crear cuenta</Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <span>Criba · versión 0.1</span>
        <span>Criba ayuda a leer; la decisión sobre cada candidato la toma siempre una persona.</span>
        <Link to="/privacidad">Privacidad y datos</Link>
      </div>
    </footer>
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 26 });
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}

/** Anillo que sigue al cursor y crece sobre lo pulsable. */
export function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 34 });
  const sy = useSpring(y, { stiffness: 500, damping: 34 });
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  useEffect(() => {
    if (reducedMotion()) return undefined;
    const move = (e) => {
      x.set(e.clientX - 14); y.set(e.clientY - 14);
      setHover(!!e.target.closest?.('a, button, input, textarea, select, label, [role="button"]'));
    };
    const d = () => setDown(true);
    const u = () => setDown(false);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerdown', d);
    window.addEventListener('pointerup', u);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', d); window.removeEventListener('pointerup', u); };
  }, [x, y]);
  if (reducedMotion()) return null;
  return (
    <motion.div
      className="cursor-dot" aria-hidden="true"
      style={{ x: sx, y: sy }}
      animate={{ scale: down ? 0.6 : hover ? 1.8 : 1, backgroundColor: hover ? 'rgba(242,233,78,.55)' : 'rgba(242,233,78,0)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
    />
  );
}

export function Toasts() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    onToast((t) => {
      setItems((s) => [...s, t]);
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== t.id)), 4200);
    });
  }, []);
  return (
    <div className="toast-zone" role="status" aria-live="polite">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id} className="toast" layout
            initial={{ opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          >
            {t.kind === 'bad' ? <Cross color="#F3A99E" /> : t.kind === 'info' ? <Info color="#F2E94E" /> : <Check color="#7FD1A8" />}
            <span>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/** Cortinilla entre páginas: una banda verde con la malla que barre la pantalla. */
export function PageWipe() {
  const { pathname } = useLocation();
  const initial = useRef(pathname);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (initial.current !== null && pathname === initial.current) return;
    initial.current = null;
    setN((c) => c + 1);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  if (n === 0 || reducedMotion()) return null;
  return (
    <motion.div
      key={n}
      className="wipe" aria-hidden="true"
      initial={{ clipPath: 'inset(100% 0 0 0)' }}
      animate={{ clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)', 'inset(0% 0 0 0)', 'inset(0 0 100% 0)'] }}
      transition={{ duration: 0.95, times: [0, 0.38, 0.55, 1], ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div initial={{ scale: 0.4, rotate: -30 }} animate={{ scale: [0.4, 1.4, 1.4, 0.6], rotate: [-30, 0, 0, 20] }} transition={{ duration: 0.95, times: [0, 0.4, 0.55, 1] }}>
        <LogoMark size={72} />
      </motion.div>
    </motion.div>
  );
}

/** Pantalla de entrada: la malla se forma y el punto amarillo cae en su sitio. */
export function Splash() {
  const [show, setShow] = useState(() => {
    if (reducedMotion()) return false;
    try { return !sessionStorage.getItem('criba.splash'); } catch { return false; }
  });
  useEffect(() => {
    if (!show) return undefined;
    try { sessionStorage.setItem('criba.splash', '1'); } catch { /* sin almacenamiento */ }
    const t = setTimeout(() => setShow(false), 1500);
    return () => clearTimeout(t);
  }, [show]);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="splash" aria-hidden="true"
          exit={{ clipPath: 'circle(0% at 50% 50%)' }}
          initial={{ clipPath: 'circle(150% at 50% 50%)' }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div
            style={{ display: 'grid', justifyItems: 'center', gap: 16 }}
            initial={{ scale: 0.6 }} animate={{ scale: [0.6, 1.15, 1] }} transition={{ duration: 0.9 }}
          >
            <LogoMark size={120} animate />
            <motion.span
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 44, letterSpacing: '-0.02em' }}
              initial={{ opacity: 0, y: 20, letterSpacing: '0.4em' }} animate={{ opacity: 1, y: 0, letterSpacing: '-0.02em' }}
              transition={{ delay: 0.55, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            >
              Criba
            </motion.span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Envoltorio de página con entrada escalonada tras la cortinilla. */
export function Page({ children, title }) {
  useEffect(() => { if (title) document.title = `${title} · Criba`; }, [title]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reducedMotion() ? 0 : 0.42, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
