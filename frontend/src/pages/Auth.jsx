import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Check } from '../components/Icons.jsx';
import { Page } from '../components/Layout.jsx';
import { LogoMark } from '../components/Logo.jsx';
import { Button, ErrorAlert, InfoNote, Reveal } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { burst, nudge, shake, shockwave } from '../lib/fx.js';

function PasswordField({ id, value, onChange, autoComplete, invalid, describedBy, showStrength }) {
  const [show, setShow] = useState(false);
  const score = Math.min(4, [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/, /.{12,}/].filter((r) => r.test(value)).length);
  const colors = ['var(--bad)', 'var(--bad)', '#BDB33A', 'var(--ok)', 'var(--ok)'];
  const labels = ['Muy corta', 'Débil', 'Aceptable', 'Buena', 'Muy buena'];
  return (
    <>
      <div className="pw-wrap">
        <input
          id={id} className="input" type={show ? 'text' : 'password'} value={value} onChange={onChange}
          autoComplete={autoComplete} required aria-invalid={invalid || undefined} aria-describedby={describedBy}
        />
        <button type="button" className="btn btn-ghost btn-sm pw-toggle" onClick={() => setShow((s) => !s)} aria-pressed={show}>
          {show ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>
      {showStrength && value && (
        <div aria-hidden="true" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="strength" style={{ flex: 1 }}><span style={{ width: `${(score + 1) * 20}%`, background: colors[score] }} /></div>
          <span className="help">{labels[score]}</span>
        </div>
      )}
    </>
  );
}

function AuthAside({ title, children }) {
  return (
    <div className="auth-aside">
      <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.5 }}>
        <LogoMark size={64} animate loop />
      </motion.div>
      <h1>{title}</h1>
      {children}
    </div>
  );
}

export function Register() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [f, setF] = useState({ companyName: '', email: '', password: '', acceptDpa: false });
  const [error, setError] = useState(null);
  const [fieldErr, setFieldErr] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const fail = (err, fields = {}) => {
    setError(err); setFieldErr(fields);
    nudge(formRef.current); shake('medium');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!f.companyName.trim()) return fail({ message: 'Escribe el nombre de tu empresa.' }, { companyName: true });
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return fail({ message: 'El email no tiene un formato válido.', hint: 'Revisa que tenga una @ y un dominio.' }, { email: true });
    if (f.password.length < 8) return fail({ message: 'La contraseña es demasiado corta.', hint: 'Usa 8 caracteres o más.' }, { password: true });
    if (!f.acceptDpa) return fail({ message: 'Para crear la cuenta tienes que aceptar el contrato de encargo de tratamiento.', hint: 'Marca la casilla de aceptación.' }, { acceptDpa: true });
    setBusy(true); setError(null); setFieldErr({});
    try {
      const res = await api('/auth/register', { method: 'POST', body: f });
      const btn = formRef.current?.querySelector('[type=submit]');
      if (btn) { shockwave(btn); burst(btn, { count: 50, spread: 340 }); }
      shake('hard');
      signIn(res);
      setTimeout(() => navigate('/panel?bienvenida=1'), 450);
    } catch (err) {
      fail(err, err.code === 'EMAIL_TAKEN' ? { email: true } : {});
    } finally { setBusy(false); }
  };

  return (
    <Page title="Crear cuenta">
      <div className="container auth-wrap">
        <AuthAside title="Crea tu cuenta">
          <p className="lead">Empiezas en el plan Gratis: una vacante y 10 CVs al mes para probar Criba con un caso real.</p>
          <ul className="ticks">
            {['Ranking de candidatos por encaje', 'Informe con fortalezas, carencias y preguntas', 'Sin tarjeta y sin cobro'].map((t, i) => (
              <motion.li key={t} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 + i * 0.1 }}><Check />{t}</motion.li>
            ))}
          </ul>
        </AuthAside>
        <Reveal className="card card-pad auth-card">
          <form className="form" onSubmit={submit} noValidate ref={formRef}>
            <h2 style={{ fontSize: 26 }}>Datos de la empresa</h2>
            {error && <ErrorAlert error={error} />}
            <div className="field">
              <label htmlFor="company">Nombre de la empresa</label>
              <input id="company" className="input" value={f.companyName} onChange={set('companyName')} autoComplete="organization" required aria-invalid={fieldErr.companyName || undefined} />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" className="input" type="email" value={f.email} onChange={set('email')} autoComplete="email" required aria-invalid={fieldErr.email || undefined} />
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <PasswordField id="password" value={f.password} onChange={set('password')} autoComplete="new-password" invalid={fieldErr.password} describedBy="pw-help" showStrength />
              <span className="help" id="pw-help">8 caracteres o más.</span>
            </div>
            <label className="check">
              <input type="checkbox" checked={f.acceptDpa} onChange={set('acceptDpa')} aria-invalid={fieldErr.acceptDpa || undefined} />
              <span>
                Acepto el contrato de encargo de tratamiento de datos (art. 28 RGPD) y confirmo que mi empresa tiene base legal para tratar los CVs de sus candidatos e informarles del uso de IA. <Link to="/privacidad">Leer las condiciones</Link>
              </span>
            </label>
            <Button type="submit" size="lg" disabled={busy} magnetic>{busy ? 'Creando cuenta…' : 'Crear cuenta'}</Button>
            <p className="muted">¿Ya tienes cuenta? <Link to="/entrar">Inicia sesión</Link></p>
          </form>
        </Reveal>
      </div>
    </Page>
  );
}

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const formRef = useRef(null);
  const [f, setF] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!f.email || !f.password) {
      setError({ message: 'Escribe tu email y tu contraseña.' });
      nudge(formRef.current); shake('soft');
      return;
    }
    setBusy(true); setError(null);
    try {
      const res = await api('/auth/login', { method: 'POST', body: f });
      const btn = formRef.current?.querySelector('[type=submit]');
      if (btn) { shockwave(btn); burst(btn, { count: 30 }); }
      shake('medium');
      signIn(res);
      setTimeout(() => navigate('/panel'), 350);
    } catch (err) {
      setError(err);
      nudge(formRef.current);
      shake(err.code === 'LOCKED' ? 'quake' : 'hard');
    } finally { setBusy(false); }
  };

  return (
    <Page title="Iniciar sesión">
      <div className="container auth-wrap">
        <AuthAside title="Hola de nuevo">
          <p className="lead">Entra para ver tus vacantes y seguir leyendo candidatos.</p>
        </AuthAside>
        <Reveal className="card card-pad auth-card">
          <form className="form" onSubmit={submit} noValidate ref={formRef}>
            <h2 style={{ fontSize: 26 }}>Iniciar sesión</h2>
            {params.get('caducada') && !error && <InfoNote>Tu sesión ha caducado. Vuelve a entrar para continuar.</InfoNote>}
            {error && <ErrorAlert error={error} />}
            <div className="field">
              <label htmlFor="lemail">Email</label>
              <input id="lemail" className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" required />
            </div>
            <div className="field">
              <label htmlFor="lpassword">Contraseña</label>
              <PasswordField id="lpassword" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" />
              <span className="help">¿La has olvidado? La recuperación por email llegará pronto; mientras, escribe a soporte.</span>
            </div>
            <Button type="submit" size="lg" disabled={busy} magnetic>{busy ? 'Entrando…' : 'Entrar'}</Button>
            <p className="muted">¿No tienes cuenta? <Link to="/registro">Crea una gratis</Link></p>
          </form>
        </Reveal>
      </div>
    </Page>
  );
}
