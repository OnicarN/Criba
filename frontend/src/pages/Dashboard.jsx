import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Archive, ArrowRight, Trash } from '../components/Icons.jsx';
import { Page } from '../components/Layout.jsx';
import { Button, CountUp, ErrorAlert, InfoNote, Reveal } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { burst, flash, impact, nudge, shake, shockwave, toast } from '../lib/fx.js';

const fmtDate = (iso) => new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

function Meter({ label, used, limit, unit }) {
  const pct = limit == null ? Math.min(100, used ? 12 : 0) : Math.min(100, Math.round((used / limit) * 100));
  const state = limit == null ? '' : used >= limit ? 'full' : pct >= 80 ? 'warn' : '';
  return (
    <div className="meter">
      <div className="meter-top">
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span><span className="meter-val"><CountUp value={used} /></span> <span className="muted">/ {limit == null ? 'ilimitado' : `${limit} ${unit}`}</span></span>
      </div>
      <div className={`meter-track ${state}`} aria-hidden="true">
        <motion.span initial={{ scaleX: 0 }} animate={{ scaleX: pct / 100 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }} />
      </div>
    </div>
  );
}

export function UsagePanel({ user }) {
  if (!user?.usage) return null;
  const u = user.usage;
  const cvWarn = u.cvLimit != null && u.cvUsed >= u.cvLimit * 0.8;
  const cvFull = u.cvLimit != null && u.cvUsed >= u.cvLimit;
  return (
    <Reveal className="card card-pad" style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <h2 style={{ fontSize: 22 }}>Consumo de este mes · plan {user.planLabel}</h2>
        <Link to="/planes">Cambiar de plan</Link>
      </div>
      <div className="usage">
        <Meter label="CVs analizados" used={u.cvUsed} limit={u.cvLimit} unit="CVs" />
        <Meter label="Vacantes activas" used={u.vacanciesActive} limit={u.vacancyLimit} unit={u.vacancyLimit === 1 ? 'vacante' : 'vacantes'} />
      </div>
      {cvFull ? (
        <div className="alert alert-warn" role="status"><strong>Has llegado al límite de CVs de este mes.</strong> Se reinicia el día 1. Si lo necesitas antes, <Link to="/planes">cambia de plan</Link>.</div>
      ) : cvWarn ? (
        <div className="alert alert-warn" role="status"><strong>Llevas más del 80 % de tus CVs del mes.</strong> Cuando llegues al límite no podrás subir más hasta el día 1.</div>
      ) : null}
    </Reveal>
  );
}

function NewVacancy({ onCreated, onCancel }) {
  const ref = useRef(null);
  const [f, setF] = useState({ title: '', description: '', requirements: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!f.title.trim() || !f.description.trim()) {
      setError({ message: 'El puesto y la descripción son obligatorios.', hint: 'Los requisitos puedes dejarlos para luego.' });
      nudge(ref.current); shake('medium');
      return;
    }
    setBusy(true); setError(null);
    try {
      const v = await api('/vacancies', { method: 'POST', body: f });
      const btn = ref.current?.querySelector('[type=submit]');
      if (btn) { shockwave(btn); burst(btn, { count: 36 }); }
      shake('medium');
      onCreated(v);
    } catch (err) {
      setError(err); nudge(ref.current); shake('hard');
    } finally { setBusy(false); }
  };
  return (
    <motion.form
      ref={ref} className="card card-pad form" onSubmit={submit} noValidate
      initial={{ opacity: 0, height: 0, y: -20 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} style={{ overflow: 'hidden' }}
    >
      <h2 style={{ fontSize: 26 }}>Nueva vacante</h2>
      {error && <ErrorAlert error={error} />}
      <VacancyFields f={f} setF={setF} />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button type="submit" disabled={busy} magnetic>{busy ? 'Creando…' : 'Crear vacante'}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
    </motion.form>
  );
}

export function VacancyFields({ f, setF }) {
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <>
      <div className="field">
        <label htmlFor="v-title">Puesto</label>
        <input id="v-title" className="input" value={f.title} onChange={set('title')} maxLength={160} placeholder="Por ejemplo: Desarrollador/a backend" required />
      </div>
      <div className="field">
        <label htmlFor="v-desc">Descripción</label>
        <textarea id="v-desc" className="textarea" rows={4} value={f.description} onChange={set('description')} maxLength={8000} required />
        <span className="help">Qué hará la persona en el día a día.</span>
      </div>
      <div className="field">
        <label htmlFor="v-req">Requisitos <span className="muted" style={{ fontWeight: 400 }}>(opcional)</span></label>
        <textarea id="v-req" className="textarea" rows={4} value={f.requirements || ''} onChange={set('requirements')} maxLength={8000} />
        <span className="help">Lo imprescindible y lo deseable. Hasta 8.000 caracteres ({(f.requirements || '').length.toLocaleString('es-ES')}).</span>
      </div>
    </>
  );
}

function VacancyCard({ v, index, onDelete, onArchive }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => { if (confirm) confirmRef.current?.focus(); }, [confirm]);

  const doDelete = async () => {
    setBusy(true);
    try {
      await api(`/vacancies/${v.id}`, { method: 'DELETE' });
      impact(cardRef.current, 'bad');
      flash('rgba(178,58,43,.18)');
      onDelete(v.id);
    } catch (err) {
      toast(err.message, 'bad'); shake('soft'); setBusy(false);
    }
  };

  return (
    <motion.li
      layout ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6, rotate: -6, filter: 'blur(8px)', transition: { duration: 0.45 } }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 26 }}
      className="card vac-card" style={{ listStyle: 'none' }}
    >
      <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
        <h3 style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to={`/vacantes/${v.id}`}>{v.title}</Link>
          {v.archived && <span className="tag-archived">Archivada</span>}
        </h3>
        <span className="muted">Creada el {fmtDate(v.createdAt)} · {v.analysisCount} {v.analysisCount === 1 ? 'CV analizado' : 'CVs analizados'}</span>
      </div>
      <div className="vac-actions">
        <Button to={`/vacantes/${v.id}`} size="sm" magnetic>Abrir <ArrowRight size={18} /></Button>
        <Button variant="ghost" size="sm" onClick={() => onArchive(v)} aria-label={`${v.archived ? 'Reactivar' : 'Archivar'} ${v.title}`}>
          <Archive /> {v.archived ? 'Reactivar' : 'Archivar'}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => { setConfirm(true); shake('soft'); }} aria-expanded={confirm} aria-label={`Eliminar ${v.title}`}>
          <Trash /> Eliminar
        </Button>
      </div>
      <AnimatePresence>
        {confirm && (
          <motion.div
            className="confirm-row" role="alertdialog" aria-label={`Confirmar borrado de ${v.title}`}
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
          >
            <span style={{ flex: '1 1 220px' }}><strong>¿Eliminar «{v.title}»?</strong> Se borrarán también sus análisis.</span>
            <Button ref={confirmRef} variant="danger" size="sm" onClick={doDelete} disabled={busy}>{busy ? 'Eliminando…' : 'Sí, eliminar'}</Button>
            <Button variant="secondary" size="sm" onClick={() => setConfirm(false)}>Cancelar</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}

function DangerZone() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const del = async () => {
    try {
      await api('/account', { method: 'DELETE' });
      shake('quake'); flash('rgba(178,58,43,.3)');
      setTimeout(() => logout('/'), 600);
    } catch (err) { setError(err); shake('hard'); }
  };
  return (
    <div className="card card-pad" style={{ display: 'grid', gap: 14, marginTop: 40 }}>
      <h2 style={{ fontSize: 20 }}>Borrar la cuenta</h2>
      <p className="muted">Se borran de forma definitiva la cuenta, sus vacantes y todos los análisis.</p>
      {!open ? (
        <div><Button variant="secondary" size="sm" onClick={() => setOpen(true)}>Quiero borrar mi cuenta</Button></div>
      ) : (
        <div className="confirm-row" role="alertdialog" aria-label="Confirmar borrado de la cuenta">
          <label htmlFor="del-confirm" style={{ flexBasis: '100%' }}>Escribe <strong>BORRAR</strong> para confirmar.</label>
          <input id="del-confirm" className="input" style={{ flex: '1 1 160px', maxWidth: 220 }} value={text} onChange={(e) => setText(e.target.value)} />
          <Button variant="danger" size="sm" disabled={text !== 'BORRAR'} onClick={del}>Borrar definitivamente</Button>
          <Button variant="secondary" size="sm" onClick={() => { setOpen(false); setText(''); }}>Cancelar</Button>
          {error && <ErrorAlert error={error} />}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = () => api('/vacancies').then(setList).catch(setError);
  useEffect(() => { load(); refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (params.get('bienvenida')) {
      setTimeout(() => {
        burst({ x: window.innerWidth / 2, y: window.innerHeight / 3 }, { count: 70, spread: 420 });
        toast('Cuenta creada. Empieza creando tu primera vacante.');
      }, 700);
      setParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onCreated = (v) => {
    setCreating(false);
    toast(`Vacante «${v.title}» creada.`);
    refresh();
    setTimeout(() => navigate(`/vacantes/${v.id}`), 500);
  };

  const onArchive = async (v) => {
    try {
      const updated = await api(`/vacancies/${v.id}`, { method: 'PATCH', body: { archived: !v.archived } });
      setList((s) => s.map((x) => (x.id === v.id ? updated : x)));
      shake('soft');
      toast(updated.archived ? 'Vacante archivada. Puedes consultarla, pero no admite nuevas subidas.' : 'Vacante reactivada.', 'info');
      refresh();
    } catch (err) { toast(err.message, 'bad'); shake('medium'); }
  };

  return (
    <Page title="Mis vacantes">
      <div className="container" style={{ paddingBottom: 88 }}>
        <div className="page-head">
          <div style={{ display: 'grid', gap: 8 }}>
            <p className="overline">{user?.companyName}</p>
            <h1>Mis vacantes</h1>
          </div>
          {!creating && <Button size="lg" magnetic onClick={() => setCreating(true)}>Nueva vacante</Button>}
        </div>

        <div style={{ display: 'grid', gap: 24 }}>
          <UsagePanel user={user} />
          <AnimatePresence>{creating && <NewVacancy onCreated={onCreated} onCancel={() => setCreating(false)} />}</AnimatePresence>
          {error && <ErrorAlert error={error} />}
          {list === null && !error && <div className="muted" role="status">Cargando vacantes…</div>}
          {list && list.length === 0 && !creating && (
            <Reveal className="empty">
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}><Archive size={36} /></motion.div>
              <h2 style={{ fontSize: 24 }}>Aún no tienes vacantes</h2>
              <p className="muted">Crea una con el puesto y sus requisitos, y después sube los currículums.</p>
              <Button onClick={() => setCreating(true)} magnetic>Crear la primera vacante</Button>
            </Reveal>
          )}
          {list && list.length > 0 && (
            <ul className="vac-list" style={{ padding: 0, margin: 0 }}>
              <AnimatePresence>
                {list.map((v, i) => (
                  <VacancyCard
                    key={v.id} v={v} index={i} onArchive={onArchive}
                    onDelete={(id) => { setList((s) => s.filter((x) => x.id !== id)); toast('Vacante eliminada con sus análisis.', 'info'); refresh(); }}
                  />
                ))}
              </AnimatePresence>
            </ul>
          )}
          <InfoNote>La puntuación y la recomendación son una ayuda para leer más rápido. Criba no descarta ni contacta a nadie: decides tú.</InfoNote>
        </div>
        <DangerZone />
      </div>
    </Page>
  );
}
