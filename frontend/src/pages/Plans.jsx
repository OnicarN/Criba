import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from '../components/Icons.jsx';
import { Page } from '../components/Layout.jsx';
import { Button, ErrorAlert, InfoNote, Reveal, Tilt } from '../components/ui.jsx';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { burst, flash, shake, shockwave, toast } from '../lib/fx.js';

// Copia local por si la API no responde: la página de planes debe verse siempre (RF-40).
const FALLBACK = [
  { id: 'GRATIS', name: 'Gratis', monthlyPrice: 0, audience: 'Probar el análisis', features: ['10 CVs analizados al mes', '1 vacante activa', 'Informe de encaje y estructura', 'Ranking de candidatos'] },
  { id: 'PRO', name: 'Pro', monthlyPrice: 49, audience: 'Equipos de selección pequeños', highlighted: true, features: ['300 CVs analizados al mes', 'Vacantes ilimitadas', 'Ranking y comparativa', 'Preguntas de entrevista', 'Soporte por correo'] },
  { id: 'EMPRESA', name: 'Empresa', monthlyPrice: 199, audience: 'Alto volumen de candidaturas', features: ['CVs ilimitados', 'Vacantes ilimitadas', 'Ranking y comparativa', 'Exportación de informes', 'Soporte prioritario'] },
];

export function PlanCards() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState(FALLBACK);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { api('/plans').then(setPlans).catch(() => {}); }, []);

  const choose = async (plan, e) => {
    if (!user) { navigate('/registro'); return; }
    const el = e.currentTarget;
    setBusy(plan.id); setError(null);
    try {
      const me = await api('/account/plan', { method: 'PUT', body: { plan: plan.id } });
      setUser(me);
      flash('rgba(14,92,99,.18)');
      shake('medium');
      shockwave(el);
      burst(el, { count: 40, spread: 300 });
      toast(`Ahora estás en el plan ${plan.name}.`);
    } catch (err) {
      setError(err); shake('soft');
    } finally { setBusy(null); }
  };

  return (
    <>
      {error && <div style={{ marginBottom: 16 }}><ErrorAlert error={error} /></div>}
      <div className="plans">
        {plans.map((p, i) => {
          const current = user?.plan === p.id;
          return (
            <Reveal key={p.id} delay={i * 0.12} style={{ display: 'flex' }}>
              <Tilt className={`plan ${p.highlighted ? 'featured' : ''}`} max={5} style={{ flex: 1 }}>
                {p.highlighted && (
                  <motion.span className="plan-badge" animate={{ rotate: [0, -4, 4, 0] }} transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3 }}>
                    Pensado para equipos pequeños
                  </motion.span>
                )}
                <h2 style={{ fontSize: 28 }}>{p.name}</h2>
                <p className="muted">{p.audience}</p>
                <div className="plan-price">{p.monthlyPrice} € <small>al mes · provisional</small></div>
                <ul className="ticks">
                  {p.features.map((f) => <li key={f}><Check />{f}</li>)}
                </ul>
                {current ? (
                  <div className="plan-current" role="status"><Check /> Tu plan actual</div>
                ) : (
                  <Button
                    variant={p.highlighted ? 'primary' : 'outline-primary'} magnetic
                    onClick={(e) => choose(p, e)} disabled={busy === p.id}
                  >
                    {busy === p.id ? 'Cambiando…' : user ? `Cambiar a ${p.name}` : p.monthlyPrice === 0 ? 'Empezar gratis' : `Empezar con ${p.name}`}
                  </Button>
                )}
              </Tilt>
            </Reveal>
          );
        })}
      </div>
    </>
  );
}

const ROWS = [
  ['Precio mensual (provisional)', '0 €', '49 €', '199 €'],
  ['CVs analizados al mes', '10', '300', 'Ilimitados'],
  ['Vacantes activas', '1', 'Ilimitadas', 'Ilimitadas'],
  ['Informe de encaje y estructura', 'Incluido', 'Incluido', 'Incluido'],
  ['Ranking y comparativa de candidatos', 'Ranking', 'Ranking y comparativa', 'Ranking y comparativa'],
  ['Preguntas de entrevista sugeridas', 'Por definir', 'Incluido', 'Incluido'],
  ['Varios usuarios por cuenta', 'No', 'Por definir', 'Incluido'],
  ['Exportación de informes', 'No', 'Por definir', 'Incluido'],
  ['Soporte', 'Comunidad o correo', 'Correo', 'Prioritario'],
];

export default function Plans() {
  return (
    <Page title="Planes">
      <div className="container" style={{ paddingTop: 48, paddingBottom: 88 }}>
        <Reveal className="section-head">
          <p className="overline">Planes</p>
          <h1>Elige cuánto quieres leer al mes</h1>
          <p className="lead">Todas las cuentas empiezan en el plan Gratis. Los precios son provisionales y, por ahora, cambiar de plan no tiene coste.</p>
        </Reveal>
        <PlanCards />
        <Reveal style={{ marginTop: 56 }}>
          <div className="table-wrap">
            <table>
              <caption>Comparativa de planes</caption>
              <thead>
                <tr><th scope="col">Característica</th><th scope="col">Gratis</th><th scope="col">Pro</th><th scope="col">Empresa</th></tr>
              </thead>
              <tbody>
                {ROWS.map(([k, ...v], i) => (
                  <motion.tr key={k} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
                    <th scope="row" style={{ fontWeight: 500 }}>{k}</th>
                    {v.map((c, j) => <td key={j}>{c}</td>)}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
        <div style={{ marginTop: 24 }}><InfoNote>
          Los CVs que fallan por un error de la IA no cuentan contra el límite del mes. El contador se reinicia el día 1.
        </InfoNote></div>
      </div>
    </Page>
  );
}
