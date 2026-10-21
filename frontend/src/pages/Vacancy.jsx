import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Columns, Cross, Download, Edit, Retry, Search, Trash, Upload } from '../components/Icons.jsx';
import { Page } from '../components/Layout.jsx';
import { LogoMark } from '../components/Logo.jsx';
import { Button, ErrorAlert, InfoNote, RecBadge, REC_LABEL, Score, ScoreRing } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { burst, flash, impact, nudge, shake, shockwave, toast } from '../lib/fx.js';
import { VacancyFields } from './Dashboard.jsx';

const MAX_FILES = 10;
const MAX_BYTES = 10 * 1024 * 1024;
const OK_EXT = ['pdf', 'txt', 'docx'];
const CONCURRENCY = 2;
const STATUS_LABEL = { SIN_REVISAR: 'Sin revisar', EN_PROCESO: 'En proceso', ENTREVISTADO: 'Entrevistado/a', DESCARTADO: 'Descartado/a por mí' };

const ext = (name) => name.split('.').pop().toLowerCase();

function validateFile(file) {
  if (!OK_EXT.includes(ext(file.name))) return { message: 'Este formato no se admite.', hint: 'Sube el CV en PDF, TXT o DOCX.' };
  if (file.size > MAX_BYTES) return { message: 'El archivo supera los 10 MB.', hint: 'Reduce el tamaño del PDF o guárdalo como TXT.' };
  if (file.size === 0) return { message: 'El archivo está vacío.', hint: 'Comprueba que se guardó bien y súbelo de nuevo.' };
  return null;
}

/** Malla animada mientras se analiza: los puntos pasan por la criba. */
function SieveLoader() {
  return (
    <div aria-hidden="true" style={{ position: 'relative', width: 24, height: 24 }}>
      <LogoMark size={24} animate loop />
    </div>
  );
}

/* ---------------- Subida ---------------- */

function Uploader({ vacancyId, disabled, onResult, onBatchDone }) {
  const [drag, setDrag] = useState(false);
  const [queue, setQueue] = useState([]);
  const [batchError, setBatchError] = useState(null);
  const inputRef = useRef(null);
  const zoneRef = useRef(null);
  const running = useRef(0);
  const pending = useRef([]);
  const files = useRef(new Map());

  const update = (id, patch) => setQueue((q) => q.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const runOne = useCallback(async (id) => {
    const file = files.current.get(id);
    update(id, { state: 'running', error: null, startedAt: Date.now() });
    const form = new FormData();
    form.append('files', file, file.name);
    try {
      const [res] = await api(`/vacancies/${vacancyId}/analyses`, { method: 'POST', form });
      if (res.ok) {
        update(id, { state: 'done', analysis: res.analysis });
        files.current.delete(id);
        onResult(res.analysis);
      } else {
        update(id, { state: 'error', error: res.error });
        shake('soft');
      }
    } catch (err) {
      update(id, { state: 'error', error: { message: err.message, hint: err.hint } });
      shake('soft');
    }
  }, [vacancyId, onResult]);

  const pump = useCallback(() => {
    while (running.current < CONCURRENCY && pending.current.length) {
      const id = pending.current.shift();
      running.current++;
      runOne(id).finally(() => {
        running.current--;
        if (running.current === 0 && pending.current.length === 0) onBatchDone();
        pump();
      });
    }
  }, [runOne, onBatchDone]);

  const add = (list) => {
    setBatchError(null);
    const arr = Array.from(list || []);
    if (!arr.length) return;
    if (arr.length > MAX_FILES) {
      setBatchError({ message: `Has elegido ${arr.length} archivos y el máximo por tanda es ${MAX_FILES}.`, hint: 'Divide los CVs en varias tandas.' });
      nudge(zoneRef.current); shake('hard');
      return;
    }
    const items = arr.map((f) => {
      const id = Math.random().toString(36).slice(2);
      const err = validateFile(f);
      if (!err) files.current.set(id, f);
      return { id, name: f.name, state: err ? 'error' : 'queued', error: err, local: !!err };
    });
    setQueue((q) => [...items, ...q.filter((x) => x.state === 'running' || x.state === 'queued')]);
    shockwave(zoneRef.current);
    shake(items.length > 4 ? 'medium' : 'soft');
    items.filter((i) => !i.error).forEach((i) => pending.current.push(i.id));
    if (items.some((i) => i.error)) setTimeout(() => shake('soft'), 300);
    pump();
  };

  const retry = (id) => {
    if (!files.current.has(id)) return;
    update(id, { state: 'queued', error: null });
    pending.current.push(id);
    pump();
  };

  const busy = queue.some((q) => q.state === 'running' || q.state === 'queued');
  const done = queue.filter((q) => q.state === 'done').length;
  const total = queue.filter((q) => !q.local).length;

  return (
    <section aria-labelledby="up-title" style={{ display: 'grid', gap: 12 }}>
      <motion.div
        ref={zoneRef}
        className={`dropzone ${drag ? 'drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (!disabled) add(e.dataTransfer.files); }}
        animate={{ scale: drag ? 1.03 : 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <motion.div className="dropzone-ico" animate={drag ? { y: [0, -10, 0], rotate: [0, -8, 8, 0] } : { y: 0 }} transition={{ duration: 0.6, repeat: drag ? Infinity : 0 }}>
          <Upload />
        </motion.div>
        <h2 id="up-title">{disabled ? 'Vacante archivada' : 'Arrastra aquí los currículums'}</h2>
        <p className="muted">
          {disabled ? 'Reactívala desde Mis vacantes para subir más CVs.' : 'PDF, TXT o DOCX, hasta 10 archivos de 10 MB cada uno.'}
        </p>
        <input
          ref={inputRef} type="file" multiple accept=".pdf,.txt,.docx,application/pdf,text/plain"
          className="sr-only" tabIndex={-1} aria-hidden="true"
          onChange={(e) => { add(e.target.files); e.target.value = ''; }}
        />
        <Button onClick={() => inputRef.current?.click()} disabled={disabled} magnetic>Subir currículums</Button>
      </motion.div>

      {batchError && <ErrorAlert error={batchError} />}

      {queue.length > 0 && (
        <div className="queue" aria-live="polite">
          {total > 0 && (
            <div className="muted small" role="status">
              {busy ? `Analizando… ${done} de ${total} listos. Puedes seguir leyendo el ranking mientras tanto.` : `Tanda analizada: ${done} de ${total} listos.`}
            </div>
          )}
          <AnimatePresence initial={false}>
            {queue.map((q) => (
              <motion.div
                key={q.id} layout
                className={`qitem ${q.state === 'error' ? 'err' : ''}`}
                initial={{ opacity: 0, x: -30, scale: 0.95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, height: 0 }}
              >
                <span className="qname">{q.name}</span>
                <span className="qstate">
                  {q.state === 'queued' && <>En cola</>}
                  {q.state === 'running' && <><SieveLoader /> Leyendo y analizando…</>}
                  {q.state === 'done' && <motion.span initial={{ scale: 0 }} animate={{ scale: [0, 1.4, 1] }} style={{ display: 'inline-flex', gap: 6, color: 'var(--ok)', fontWeight: 600 }}><Check /> Analizado</motion.span>}
                  {q.state === 'error' && <span style={{ display: 'inline-flex', gap: 6, color: 'var(--bad-text)', fontWeight: 600 }}><Cross color="var(--bad-text)" /> No analizado</span>}
                </span>
                {q.state === 'error' && !q.local && (
                  <Button variant="secondary" size="sm" onClick={() => retry(q.id)}><Retry /> Reintentar</Button>
                )}
                {q.state === 'error' && q.error && (
                  <span className="qmsg" role="alert"><strong>{q.error.message}</strong> {q.error.hint}</span>
                )}
                {q.state === 'running' && (
                  <motion.span className="qprog" initial={{ width: '0%' }} animate={{ width: '92%' }} transition={{ duration: 25, ease: [0.1, 0.6, 0.3, 1] }} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {!busy && <div><Button variant="ghost" size="sm" onClick={() => setQueue([])}>Limpiar la lista</Button></div>}
        </div>
      )}
    </section>
  );
}

/* ---------------- Filtros ---------------- */

function useFilters(vacancyId) {
  const key = `criba.filters.${vacancyId}`;
  const [filters, setFilters] = useState(() => {
    try { return { q: '', recs: [], min: 0, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch { return { q: '', recs: [], min: 0 }; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(filters)); } catch { /* sin almacenamiento */ } }, [key, filters]);
  return [filters, setFilters];
}

function Toolbar({ filters, setFilters, count, total, onExport, compareCount, onCompare }) {
  const toggle = (r) => setFilters((f) => ({ ...f, recs: f.recs.includes(r) ? f.recs.filter((x) => x !== r) : [...f.recs, r] }));
  return (
    <div className="card card-pad no-print" style={{ display: 'grid', gap: 16, padding: 20 }}>
      <div className="toolbar">
        <div className="field">
          <label htmlFor="f-q">Buscar por nombre o archivo</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: 14, color: 'var(--ink-3)' }}><Search /></span>
            <input id="f-q" className="input" style={{ paddingLeft: 42 }} value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} />
          </div>
        </div>
        <div className="field" style={{ flex: '1 1 180px' }}>
          <label htmlFor="f-min">Encaje mínimo: {filters.min}</label>
          <input id="f-min" type="range" min="0" max="100" step="5" className="range" value={filters.min} onChange={(e) => setFilters((f) => ({ ...f, min: Number(e.target.value) }))} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="chips" role="group" aria-label="Filtrar por sugerencia">
          {['AVANZAR', 'REVISAR', 'DESCARTAR'].map((r) => (
            <motion.button key={r} type="button" className="chip" aria-pressed={filters.recs.includes(r)} onClick={() => toggle(r)} whileTap={{ scale: 0.9 }}>
              {r === 'AVANZAR' ? <Check color="currentColor" size={16} /> : r === 'DESCARTAR' ? <Cross color="currentColor" size={16} /> : null}
              {REC_LABEL[r]}
            </motion.button>
          ))}
          {(filters.q || filters.recs.length > 0 || filters.min > 0) && (
            <button type="button" className="link-btn" onClick={() => setFilters({ q: '', recs: [], min: 0 })}>Quitar filtros</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="secondary" size="sm" onClick={onCompare} disabled={compareCount < 2} aria-label={`Comparar ${compareCount} candidatos`}>
            <Columns /> Comparar ({compareCount})
          </Button>
          <Button variant="secondary" size="sm" onClick={onExport} disabled={total === 0}><Download /> Exportar CSV</Button>
        </div>
      </div>
      <div className="muted small" role="status">Mostrando {count} de {total} candidatos.</div>
    </div>
  );
}

/* ---------------- Ranking ---------------- */

function RankingTable({ rows, allRows, openId, onOpen, selected, onToggle, fresh }) {
  if (allRows.length === 0) {
    return (
      <div className="empty">
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2.4, repeat: Infinity }}><LogoMark size={44} /></motion.div>
        <h2 style={{ fontSize: 22 }}>Todavía no hay candidatos</h2>
        <p className="muted">Sube los CVs de esta vacante y aparecerán aquí ordenados por encaje.</p>
      </div>
    );
  }
  return (
    <div className="table-wrap">
      <table>
        <caption>Ranking de candidatos <span className="muted" style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 14 }}>· de mayor a menor encaje</span></caption>
        <thead>
          <tr>
            <th scope="col"><span className="sr-only">Comparar</span></th>
            <th scope="col">N.º</th>
            <th scope="col">Candidato</th>
            <th scope="col">Encaje</th>
            <th scope="col">Recomendación</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 28 }}>Ningún candidato coincide con los filtros.</td></tr>
          )}
          <AnimatePresence initial={false}>
            {rows.map((a) => {
              const rank = allRows.findIndex((x) => x.id === a.id) + 1;
              const isNew = fresh.has(a.id);
              return (
                <motion.tr
                  key={a.id} layout
                  className={openId === a.id ? 'selected' : ''}
                  initial={{ opacity: 0, backgroundColor: 'rgba(242,233,78,.8)' }}
                  animate={{ opacity: 1, backgroundColor: isNew ? ['rgba(242,233,78,.8)', 'rgba(242,233,78,0)'] : 'rgba(0,0,0,0)' }}
                  exit={{ opacity: 0, x: 60 }}
                  transition={{ layout: { type: 'spring', stiffness: 350, damping: 30 }, backgroundColor: { duration: 2 } }}
                  data-row={a.id}
                >
                  <td style={{ width: 44 }}>
                    <input
                      type="checkbox" style={{ width: 22, height: 22, accentColor: 'var(--primary)' }}
                      checked={selected.includes(a.id)} onChange={() => onToggle(a.id)}
                      aria-label={`Seleccionar a ${a.candidateName} para comparar`}
                    />
                  </td>
                  <td className="rank-num">{rank}</td>
                  <td>
                    <button type="button" className="cand-btn" aria-pressed={openId === a.id} onClick={() => onOpen(a.id)}>
                      <span className="name">{a.candidateName}</span>
                      <span className="file">{a.fileName}</span>
                    </button>
                    {a.status !== 'SIN_REVISAR' && <span className="status-pill">{STATUS_LABEL[a.status]}</span>}
                  </td>
                  <td><Score value={a.score} animateIn={isNew} /></td>
                  <td><RecBadge value={a.recommendation} /></td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Informe ---------------- */

const blockAnim = (i) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.1 + i * 0.08, duration: 0.55, ease: [0.16, 1, 0.3, 1] },
});

function Report({ id, onClose, onChanged, onDeleted }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const headRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    setD(null); setError(null); setConfirmDel(false);
    api(`/analyses/${id}`).then((x) => { setD(x); setNotes(x.notes || ''); }).catch(setError);
  }, [id]);
  useEffect(() => { if (d) headRef.current?.focus(); }, [d]);

  const patch = async (body, msg) => {
    setSaving(true);
    try {
      const x = await api(`/analyses/${id}`, { method: 'PATCH', body });
      setD(x); onChanged(x); toast(msg); shake('soft');
    } catch (err) { toast(err.message, 'bad'); shake('medium'); }
    finally { setSaving(false); }
  };

  const del = async () => {
    try {
      await api(`/analyses/${id}`, { method: 'DELETE' });
      impact(rootRef.current, 'bad');
      onDeleted(id);
      toast('Análisis borrado de forma definitiva.', 'info');
    } catch (err) { toast(err.message, 'bad'); }
  };

  if (error) return <div className="card report"><ErrorAlert error={error} /><Button variant="secondary" onClick={onClose}>Cerrar informe</Button></div>;
  if (!d) {
    return (
      <div className="card report" role="status" style={{ placeItems: 'center', minHeight: 300 }}>
        <LogoMark size={56} animate loop />
        <span className="muted">Abriendo el informe…</span>
      </div>
    );
  }
  const r = d.result || {};
  const recWord = { AVANZAR: 'avanzar', REVISAR: 'revisar', DESCARTAR: 'descartar' }[d.recommendation];

  return (
    <motion.article
      ref={rootRef} className="card report" aria-labelledby="rep-title"
      initial={{ opacity: 0, x: 60, rotateY: -12 }} animate={{ opacity: 1, x: 0, rotateY: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 24 }}
    >
      <div className="report-head">
        <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
          <h2 id="rep-title" tabIndex={-1} ref={headRef}>{d.candidateName}</h2>
          <span className="muted" style={{ wordBreak: 'break-all' }}>{d.fileName}</span>
        </div>
        <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="ghost" size="sm" onClick={() => window.print()}><Download /> PDF</Button>
          <Button variant="secondary" size="sm" onClick={onClose}>Cerrar informe</Button>
        </div>
      </div>

      <motion.div className="report-score" {...blockAnim(0)}>
        <ScoreRing value={d.score} />
        <div>
          <div><span className="big">{d.score}</span> <span className="muted">de 100 de encaje</span></div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>Sugerencia: {recWord}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}><RecBadge value={d.recommendation} /></div>
      </motion.div>

      <motion.section className="report-block" {...blockAnim(1)}>
        <h3>Resumen</h3>
        <p>{r.summary}</p>
      </motion.section>

      <motion.section className="report-block" {...blockAnim(2)}>
        <h3>Puntos fuertes</h3>
        {r.strengths?.length ? (
          <ul className="ticks">{r.strengths.map((s, i) => (
            <motion.li key={i} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.07 }}>
              <Check /><span className="mark-line" style={{ animationDelay: `${0.5 + i * 0.12}s` }}>{s}</span>
            </motion.li>
          ))}</ul>
        ) : <p className="muted">El análisis no destaca puntos fuertes frente a esta vacante.</p>}
      </motion.section>

      <motion.section className="report-block" {...blockAnim(3)}>
        <h3>Lo que falta</h3>
        {r.gaps?.length ? (
          <ul className="ticks">{r.gaps.map((s, i) => <li key={i}><Cross /><span>{s}</span></li>)}</ul>
        ) : <p className="muted">El CV acredita todos los requisitos indicados.</p>}
      </motion.section>

      <motion.section className="report-block" {...blockAnim(4)}>
        <h3>Revisión del CV</h3>
        <p>{r.structure?.clarity}</p>
        {r.structure?.issues?.length > 0 && <ul style={{ margin: 0, paddingLeft: 22 }}>{r.structure.issues.map((s, i) => <li key={i}>{s}</li>)}</ul>}
      </motion.section>

      <motion.section className="report-block" {...blockAnim(5)}>
        <h3>Preguntas para la entrevista</h3>
        <ol>{(r.interviewQuestions || []).map((q, i) => <li key={i}>{q}</li>)}</ol>
      </motion.section>

      <motion.section className="report-block no-print" {...blockAnim(6)} style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 20 }}>
        <h3>Tu decisión</h3>
        <p className="muted small">Esto lo anotas tú y queda separado de la sugerencia.</p>
        <div className="chips" role="group" aria-label="Estado del candidato">
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <motion.button key={k} type="button" className="chip" aria-pressed={d.status === k} disabled={saving} whileTap={{ scale: 0.9 }}
              onClick={(e) => { if (d.status !== k) { shockwave(e.currentTarget); patch({ status: k }, `Estado: ${v}.`); } }}>
              {v}
            </motion.button>
          ))}
        </div>
        <div className="field">
          <label htmlFor="notes">Notas</label>
          <textarea id="notes" className="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button size="sm" disabled={saving || notes === (d.notes || '')} onClick={() => patch({ notes }, 'Nota guardada.')}>Guardar nota</Button>
          {!confirmDel ? (
            <Button variant="ghost" size="sm" onClick={() => { setConfirmDel(true); shake('soft'); }}><Trash /> Borrar análisis</Button>
          ) : (
            <div className="confirm-row" role="alertdialog" aria-label="Confirmar borrado del análisis">
              <span style={{ flex: '1 1 200px' }}>Se borrará el resultado de esta persona de forma definitiva.</span>
              <Button variant="danger" size="sm" onClick={del}>Sí, borrar</Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmDel(false)}>Cancelar</Button>
            </div>
          )}
        </div>
      </motion.section>

      <motion.div {...blockAnim(7)}>
        <InfoNote>Esto es una ayuda, no una decisión. Contrasta el informe con el currículum antes de actuar.</InfoNote>
        <p className="muted small" style={{ marginTop: 10 }}>
          Analizado el {new Date(d.createdAt).toLocaleString('es-ES')} · {d.modelVersion} · instrucciones {d.promptVersion}
        </p>
      </motion.div>
    </motion.article>
  );
}

/* ---------------- Comparar ---------------- */

function Compare({ ids, onClose }) {
  const [items, setItems] = useState(null);
  const closeRef = useRef(null);
  useEffect(() => {
    Promise.all(ids.map((id) => api(`/analyses/${id}`))).then(setItems).catch(() => setItems([]));
    closeRef.current?.focus();
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [ids, onClose]);
  return (
    <motion.div className="modal-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="modal" role="dialog" aria-modal="true" aria-labelledby="cmp-title" onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.8, y: 60, rotateX: 20 }} animate={{ scale: 1, y: 0, rotateX: 0 }} exit={{ scale: 0.9, y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <h2 id="cmp-title">Comparar candidatos</h2>
          <Button ref={closeRef} variant="secondary" size="sm" onClick={onClose}>Cerrar</Button>
        </div>
        {!items ? <p className="muted" role="status">Cargando…</p> : (
          <div className="compare-grid">
            {items.map((d, i) => (
              <motion.div key={d.id} className="card card-pad" style={{ display: 'grid', gap: 14, alignContent: 'start', padding: 20 }}
                initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1 }}>
                <h3>{d.candidateName}</h3>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><Score value={d.score} /><RecBadge value={d.recommendation} /></div>
                <p className="small">{d.result?.summary}</p>
                <div className="report-block"><h4>Puntos fuertes</h4><ul className="ticks small">{(d.result?.strengths || []).map((s, j) => <li key={j}><Check size={18} />{s}</li>)}</ul></div>
                <div className="report-block"><h4>Lo que falta</h4><ul className="ticks small">{(d.result?.gaps || []).length ? d.result.gaps.map((s, j) => <li key={j}><Cross size={18} />{s}</li>) : <li className="muted">Nada destacado</li>}</ul></div>
              </motion.div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 20 }}><InfoNote>Comparar ayuda a leer; la decisión sobre cada persona es tuya.</InfoNote></div>
      </motion.div>
    </motion.div>
  );
}

/* ---------------- Página ---------------- */

function exportCsv(vacancy, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Posición', 'Candidato', 'Archivo', 'Encaje', 'Sugerencia', 'Estado', 'Fecha'];
  const lines = rows.map((a, i) => [i + 1, a.candidateName, a.fileName, a.score, REC_LABEL[a.recommendation], STATUS_LABEL[a.status], new Date(a.createdAt).toLocaleString('es-ES')].map(esc).join(';'));
  const blob = new Blob(['﻿' + [head.map(esc).join(';'), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `criba-${vacancy.title.toLowerCase().replace(/[^a-z0-9áéíóúñü]+/gi, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Vacancy() {
  const { id } = useParams();
  const { refresh } = useAuth();
  const [vacancy, setVacancy] = useState(null);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editF, setEditF] = useState(null);
  const [editErr, setEditErr] = useState(null);
  const [selected, setSelected] = useState([]);
  const [comparing, setComparing] = useState(false);
  const [fresh, setFresh] = useState(() => new Set());
  const [filters, setFilters] = useFilters(id);
  const editRef = useRef(null);
  const batch = useRef({ ok: 0, best: null });
  const closeCompare = useCallback(() => setComparing(false), []);

  useEffect(() => {
    api(`/vacancies/${id}`).then(setVacancy).catch(setError);
    api(`/vacancies/${id}/analyses`).then(setRows).catch(() => {});
  }, [id]);

  const sorted = useMemo(() => [...rows].sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt)), [rows]);
  const visible = useMemo(() => sorted.filter((a) => {
    const q = filters.q.trim().toLowerCase();
    if (q && !a.candidateName.toLowerCase().includes(q) && !a.fileName.toLowerCase().includes(q)) return false;
    if (filters.recs.length && !filters.recs.includes(a.recommendation)) return false;
    return a.score >= filters.min;
  }), [sorted, filters]);

  const onResult = useCallback((a) => {
    setRows((r) => [...r, a]);
    setFresh((s) => new Set(s).add(a.id));
    batch.current.ok++;
    if (!batch.current.best || a.score > batch.current.best.score) batch.current.best = a;
    requestAnimationFrame(() => setTimeout(() => {
      const row = document.querySelector(`[data-row="${a.id}"]`);
      if (!row) return;
      if (a.recommendation === 'AVANZAR') { impact(row, 'ok'); }
      else { shockwave(row, a.recommendation === 'DESCARTAR' ? '#B23A2B' : '#F2E94E'); shake('soft'); }
    }, 120));
  }, []);

  const onBatchDone = useCallback(() => {
    const { ok, best } = batch.current;
    if (ok > 0) {
      flash('rgba(242,233,78,.3)');
      shake('hard');
      burst({ x: window.innerWidth / 2, y: window.innerHeight * 0.35 }, { count: 60, spread: 420 });
      toast(`${ok} ${ok === 1 ? 'CV analizado' : 'CVs analizados'}. Mayor encaje: ${best.candidateName} (${best.score}).`);
    }
    batch.current = { ok: 0, best: null };
    refresh();
  }, [refresh]);

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editF.title.trim() || !editF.description.trim()) {
      setEditErr({ message: 'El puesto y la descripción son obligatorios.' }); nudge(editRef.current); shake('medium'); return;
    }
    try {
      const v = await api(`/vacancies/${id}`, { method: 'PUT', body: editF });
      setVacancy(v); setEditing(false); setEditErr(null);
      toast('Vacante actualizada. Los análisis ya hechos se mantienen como estaban.', 'info'); shake('soft');
    } catch (err) { setEditErr(err); nudge(editRef.current); shake('hard'); }
  };

  if (error) {
    return (
      <Page title="Vacante">
        <div className="container" style={{ padding: '48px 32px' }}>
          <ErrorAlert error={error} />
          <p style={{ marginTop: 16 }}><Link to="/panel">Volver a Mis vacantes</Link></p>
        </div>
      </Page>
    );
  }

  return (
    <Page title={vacancy?.title || 'Vacante'}>
      <div className="container container-wide" style={{ paddingBottom: 88 }}>
        <div className="page-head no-print" style={{ paddingBottom: 20 }}>
          <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
            <Link to="/panel" style={{ display: 'inline-flex', gap: 6, alignItems: 'center', fontWeight: 500, minHeight: 44 }}><ArrowLeft /> Mis vacantes</Link>
            <h1 style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              {vacancy?.title || '…'}
              {vacancy?.archived && <span className="tag-archived" style={{ fontSize: 15 }}>Archivada</span>}
            </h1>
          </div>
          {vacancy && !editing && (
            <Button variant="secondary" size="sm" onClick={() => { setEditF({ title: vacancy.title, description: vacancy.description, requirements: vacancy.requirements || '' }); setEditing(true); }}>
              <Edit /> Editar vacante
            </Button>
          )}
        </div>

        <div className="no-print" style={{ marginBottom: 24 }}>
          <InfoNote>La puntuación y la recomendación son una ayuda para leer más rápido. Criba no descarta ni contacta a nadie: decides tú.</InfoNote>
        </div>

        <AnimatePresence>
          {editing && (
            <motion.form
              ref={editRef} className="card card-pad form no-print" onSubmit={saveEdit} noValidate style={{ marginBottom: 24, overflow: 'hidden' }}
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            >
              <h2 style={{ fontSize: 24 }}>Editar vacante</h2>
              <p className="muted small">Los análisis ya hechos no cambian: conservan la versión con la que se generaron.</p>
              {editErr && <ErrorAlert error={editErr} />}
              <VacancyFields f={editF} setF={setEditF} />
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Button type="submit">Guardar cambios</Button>
                <Button variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="vac-layout">
          <div className="vac-main">
            {vacancy && (
              <details className="card no-print" style={{ padding: '16px 20px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, minHeight: 32 }}>Ver la descripción y los requisitos</summary>
                <div style={{ display: 'grid', gap: 12, marginTop: 12, whiteSpace: 'pre-wrap', color: 'var(--ink-2)', fontSize: 16 }}>
                  <p>{vacancy.description}</p>
                  {vacancy.requirements && <p><strong>Requisitos:</strong> {vacancy.requirements}</p>}
                </div>
              </details>
            )}
            <div className="no-print">
              <Uploader vacancyId={id} disabled={vacancy?.archived} onResult={onResult} onBatchDone={onBatchDone} />
            </div>
            {rows.length > 0 && (
              <Toolbar
                filters={filters} setFilters={setFilters} count={visible.length} total={rows.length}
                onExport={() => { exportCsv(vacancy, sorted); toast('Ranking exportado a CSV.'); }}
                compareCount={selected.length}
                onCompare={() => { setComparing(true); shake('soft'); }}
              />
            )}
            <RankingTable
              rows={visible} allRows={sorted} openId={openId} fresh={fresh}
              onOpen={(aid) => { setOpenId(openId === aid ? null : aid); }}
              selected={selected}
              onToggle={(aid) => setSelected((s) => (s.includes(aid) ? s.filter((x) => x !== aid) : s.length >= 4 ? s : [...s, aid]))}
            />
          </div>

          <aside className="vac-report" aria-label="Informe del candidato">
            <AnimatePresence mode="wait">
              {openId ? (
                <Report
                  key={openId} id={openId}
                  onClose={() => setOpenId(null)}
                  onChanged={(x) => setRows((r) => r.map((a) => (a.id === x.id ? { ...a, status: x.status, hasNotes: !!x.notes } : a)))}
                  onDeleted={(did) => { setRows((r) => r.filter((a) => a.id !== did)); setSelected((s) => s.filter((x) => x !== did)); setOpenId(null); }}
                />
              ) : (
                <motion.div key="empty" className="report-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <LogoMark size={40} />
                  <h2 style={{ fontSize: 20 }}>Elige un candidato</h2>
                  <p className="muted">Pulsa su nombre en el ranking para leer el informe completo.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </aside>
        </div>
      </div>
      <AnimatePresence>{comparing && <Compare ids={selected} onClose={closeCompare} />}</AnimatePresence>
    </Page>
  );
}
