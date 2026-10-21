import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { Check, Chat, Cross, Doc, Info, Ranking, Upload } from '../components/Icons.jsx';
import { Page } from '../components/Layout.jsx';
import { LogoMark } from '../components/Logo.jsx';
import { Button, CountUp, Reveal, Tilt } from '../components/ui.jsx';
import { burst, shake, shockwave } from '../lib/fx.js';
import { PlanCards } from './Plans.jsx';

const ease = [0.16, 1, 0.3, 1];

function SieveRain() {
  // Puntos que caen a través de la malla; de vez en cuando uno amarillo.
  const grains = useMemo(() => Array.from({ length: 26 }, (_, i) => ({
    left: `${(i * 37) % 100}%`,
    delay: `${(i * 0.73) % 9}s`,
    dur: `${9 + ((i * 1.7) % 7)}s`,
    gold: i % 9 === 4,
  })), []);
  return (
    <div className="sieve-bg" aria-hidden="true">
      {grains.map((g, i) => (
        <span key={i} className={`grain ${g.gold ? 'gold' : ''}`} style={{ left: g.left, animationDelay: g.delay, animationDuration: g.dur }} />
      ))}
    </div>
  );
}

function HeroTitle() {
  const words = ['Lee', 'menos', 'currículums', 'y'];
  return (
    <h1>
      {words.map((w, i) => (
        <motion.span
          key={w} className="hero-word"
          initial={{ opacity: 0, y: 60, rotateX: -80 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.15 + i * 0.08, duration: 0.8, ease }}
          style={{ marginRight: '0.25em', transformOrigin: 'bottom' }}
        >
          {w}
        </motion.span>
      ))}
      <motion.span
        className="hero-word mark mark-thin mark-draw"
        style={{ animationDelay: '1.1s' }}
        initial={{ opacity: 0, y: 60, rotateX: -80 }} animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease }}
      >
        entiende mejor cada uno.
      </motion.span>
    </h1>
  );
}

function ExampleCv() {
  const [stamped, setStamped] = useState(false);
  const scoreRef = useRef(null);
  const lines = [
    { t: <>Desarrolladora backend · <span className="mark">5 años con Java y Spring Boot</span></>, ok: true },
    { t: <><span className="mark">Diseño de APIs REST</span> para una plataforma de pagos</>, ok: true },
    { t: <>Base de datos <span className="mark">PostgreSQL</span> en producción</>, ok: true },
    { t: <>Formación: Grado en Ingeniería Informática</>, ok: null },
  ];
  const onStamp = () => {
    if (stamped) return;
    setStamped(true);
    shake('soft');
    if (scoreRef.current) { shockwave(scoreRef.current); burst(scoreRef.current, { count: 18 }); }
  };
  return (
    <Tilt className="cv-card" max={6}>
      <span className="cv-label">CV de ejemplo · datos ficticios</span>
      <div className="cv-head">
        <div>
          <div className="cv-name">Lucía Ferrer</div>
          <div className="cv-role">Vacante: Desarrollador/a backend</div>
        </div>
        <motion.div
          className="cv-score" ref={scoreRef}
          initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 1.9, type: 'spring', stiffness: 300, damping: 12 }}
          onAnimationComplete={onStamp}
        >
          <div className="num"><CountUp value={86} duration={1.4} /></div>
          <div className="muted small">de 100 de encaje</div>
        </motion.div>
      </div>
      <div className="cv-lines">
        {lines.map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.15, duration: 0.6, ease }}
          >
            {l.t}
          </motion.div>
        ))}
      </div>
      <motion.div className="cv-verdict" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.5, duration: 0.6 }}>
        <div style={{ display: 'flex', gap: 8 }}><Check /><span><b className="ok">Cumple:</b> Java, Spring Boot, APIs REST y PostgreSQL.</span></div>
        <div style={{ display: 'flex', gap: 8 }}><Cross /><span><b className="bad">Falta:</b> no menciona experiencia con Docker.</span></div>
        <motion.div
          style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, fontWeight: 600, color: 'var(--ok)' }}
          initial={{ opacity: 0, scale: 1.6 }} animate={stamped ? { opacity: 1, scale: 1 } : {}}
          transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        >
          <Check /> Merece avanzar
        </motion.div>
      </motion.div>

      <motion.div
        className="floating-chip" style={{ right: -14, top: 90, transform: 'translateZ(40px)' }}
        initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
        transition={{ opacity: { delay: 2.3 }, x: { delay: 2.3 }, y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
      >
        <Info /> 3 preguntas de entrevista
      </motion.div>
      <motion.div
        className="floating-chip" style={{ left: -18, bottom: -16, transform: 'translateZ(60px)' }}
        initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0, y: [0, 7, 0] }}
        transition={{ opacity: { delay: 2.5 }, x: { delay: 2.5 }, y: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}
      >
        <Check /> Decides tú
      </motion.div>
    </Tilt>
  );
}

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const o = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  return (
    <section className="hero" ref={ref}>
      <SieveRain />
      <motion.div className="container hero-grid" style={{ y, opacity: o }}>
        <div className="hero-copy">
          <motion.p className="overline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            Primera lectura de currículums
          </motion.p>
          <div style={{ marginTop: 14, perspective: 800 }}><HeroTitle /></div>
          <motion.p className="lead" style={{ marginTop: 20 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.8 }}>
            Criba lee contigo el montón de CVs de una vacante y te dice, con sus motivos, cuáles merece la pena mirar primero. La decisión sigue siendo tuya.
          </motion.p>
          <motion.div className="hero-cta" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.6, ease }}>
            <Button to="/registro" size="lg" magnetic>Crear cuenta gratis</Button>
            <Button to="/planes" variant="secondary" size="lg" magnetic>Ver planes</Button>
          </motion.div>
          <motion.p className="hero-note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
            <Info /> Criba no descarta ni contacta a nadie: decides tú.
          </motion.p>
        </div>
        <motion.div className="hero-visual" initial={{ opacity: 0, y: 60, rotate: 4 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.4, duration: 1, ease }}>
          <ExampleCv />
        </motion.div>
      </motion.div>
    </section>
  );
}

function Marquee() {
  const items = ['Ranking en minutos', 'Cada puntuación con su porqué', 'Una ayuda, no un juez', 'Preguntas listas', 'Datos cuidados'];
  const row = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {row.map((t, i) => <span key={i}>{t}</span>)}
      </div>
    </div>
  );
}

function Steps() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 80%', 'end 60%'] });
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const steps = [
    { n: 1, t: 'Describe la vacante', d: 'Escribe el puesto, qué hará la persona y los requisitos que importan.' },
    { n: 2, t: 'Sube los currículums', d: 'Arrastra hasta 10 CVs en PDF o TXT. Si uno falla, el resto sigue.' },
    { n: 3, t: 'Lee el ranking', d: 'Los candidatos aparecen ordenados por encaje, cada uno con su informe.' },
  ];
  return (
    <section className="section" ref={ref}>
      <div className="container">
        <Reveal className="section-head">
          <p className="overline">Cómo funciona</p>
          <h2>Tres pasos, unos minutos</h2>
        </Reveal>
        <div style={{ position: 'relative', paddingTop: 24 }}>
          <div className="steps-track" aria-hidden="true"><motion.div style={{ scaleX }} /></div>
          <ol className="grid-auto" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {steps.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 0.12} className="card step">
                <motion.span className="step-num" whileHover={{ scale: 1.2, rotate: -6 }} aria-hidden="true">{s.n}</motion.span>
                <h3>{s.t}</h3>
                <p className="muted" style={{ fontSize: 16 }}>{s.d}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function ReportContents() {
  const items = [
    { i: <Ranking />, t: 'Encaje de 0 a 100', d: 'Una cifra para ordenar, siempre con su explicación al lado.' },
    { i: <Check />, t: 'Puntos fuertes', d: 'Lo que el CV acredita frente a los requisitos de tu vacante.' },
    { i: <Cross />, t: 'Lo que falta', d: 'Los requisitos que el CV no demuestra, sin suposiciones.' },
    { i: <Doc />, t: 'Revisión del CV', d: 'Si está claro y ordenado, y qué problemas de forma tiene.' },
    { i: <Chat />, t: 'Tres preguntas', d: 'Preguntas para contrastar el CV en la entrevista.' },
    { i: <Info />, t: 'Una sugerencia', d: 'Avanzar, revisar o descartar. Solo una sugerencia: decides tú.' },
  ];
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <Reveal className="section-head">
          <p className="overline">Qué trae cada informe</p>
          <h2>No solo un número: <span className="mark">el porqué</span> de cada puntuación</h2>
        </Reveal>
        <div className="grid-auto">
          {items.map((it, i) => (
            <Reveal key={it.t} delay={(i % 3) * 0.1} className="card feature">
              <motion.div className="feature-ico" whileHover={{ rotate: 12, scale: 1.12 }}>{it.i}</motion.div>
              <h3>{it.t}</h3>
              <p className="muted" style={{ fontSize: 16 }}>{it.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Guarantees() {
  const g = [
    { t: 'Decides tú', d: 'Criba ordena y explica. No descarta ni contacta a ningún candidato.' },
    { t: 'Sin rasgos personales', d: 'Edad, sexo, origen o estado civil no cuentan para la puntuación.' },
    { t: 'Sin archivos guardados', d: 'Del CV solo se guarda el resultado del análisis, no el archivo.' },
    { t: 'Cada cuenta, aislada', d: 'Ninguna empresa puede ver los datos de otra.' },
  ];
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="container">
        <Reveal className="band-dark" y={60}>
          <LogoMark size={44} animate loop />
          <h2 style={{ marginTop: 20 }}>Una ayuda, no un juez</h2>
          <p style={{ marginTop: 12, maxWidth: 560, fontSize: 18 }}>
            Criba hace la primera lectura para que dediques tu tiempo a entrevistar. Lo que pasa con cada persona lo decides tú.
          </p>
          <div className="guarantees">
            {g.map((x, i) => (
              <motion.div
                key={x.t} className="guarantee"
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.12, duration: 0.7, ease }}
              >
                <motion.span className="bar" initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} style={{ transformOrigin: 'left' }} transition={{ delay: 0.4 + i * 0.12, duration: 0.6 }} />
                <h3>{x.t}</h3>
                <p style={{ fontSize: 16 }}>{x.d}</p>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section className="section" style={{ paddingTop: 0, paddingBottom: 96 }}>
      <div className="container">
        <Reveal className="closing" y={60}>
          <SieveRain />
          <h2>Prueba Criba con tu próxima vacante</h2>
          <p>El plan Gratis te deja analizar 10 CVs al mes con una vacante real. Sin tarjeta.</p>
          <Button to="/registro" variant="inverse" size="lg" magnetic>Crear cuenta gratis <Upload size={20} /></Button>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Page title="Lee menos currículums y entiende mejor cada uno">
      <Hero />
      <Marquee />
      <Steps />
      <ReportContents />
      <Guarantees />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="section-head">
            <p className="overline">Planes</p>
            <h2>Empieza gratis y cambia cuando se te quede corto</h2>
            <p className="muted">Precios provisionales. Por ahora no se cobra.</p>
          </Reveal>
          <PlanCards />
        </div>
      </section>
      <Closing />
    </Page>
  );
}
