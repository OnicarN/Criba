import '@fontsource/bricolage-grotesque/500.css';
import '@fontsource/bricolage-grotesque/700.css';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import './styles.css';

import { MotionConfig } from 'framer-motion';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Cursor, Footer, Header, Page, PageWipe, ScrollProgress, Splash, Toasts } from './components/Layout.jsx';
import { Button } from './components/ui.jsx';
import { AuthProvider, useAuth } from './lib/auth.jsx';
import { Login, Register } from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Home from './pages/Home.jsx';
import Plans from './pages/Plans.jsx';
import Privacy from './pages/Privacy.jsx';
import Vacancy from './pages/Vacancy.jsx';

function Private({ children }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <div className="container muted" role="status" style={{ padding: 48 }}>Cargando…</div>;
  if (!user) return <Navigate to="/entrar" replace state={{ from: loc.pathname }} />;
  return children;
}

function PublicOnly({ children }) {
  const { user, ready } = useAuth();
  if (ready && user) return <Navigate to="/panel" replace />;
  return children;
}

function NotFound() {
  return (
    <Page title="No encontrada">
      <div className="container" style={{ padding: '88px 32px', display: 'grid', gap: 16, justifyItems: 'start' }}>
        <p className="overline">Error 404</p>
        <h1>Esta página no existe</h1>
        <p className="lead">Puede que el enlace esté mal escrito o que la página se haya movido.</p>
        <Button to="/">Volver al inicio</Button>
      </div>
    </Page>
  );
}

function App() {
  const location = useLocation();
  return (
    <MotionConfig reducedMotion="user">
      <a href="#main" className="skip-link">Saltar al contenido</a>
      <Splash />
      <ScrollProgress />
      <div className="app-shell">
        <Header />
        <main id="main" tabIndex={-1}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PublicOnly><Home /></PublicOnly>} />
            <Route path="/planes" element={<Plans />} />
            <Route path="/registro" element={<PublicOnly><Register /></PublicOnly>} />
            <Route path="/entrar" element={<PublicOnly><Login /></PublicOnly>} />
            <Route path="/privacidad" element={<Privacy />} />
            <Route path="/panel" element={<Private><Dashboard /></Private>} />
            <Route path="/vacantes/:id" element={<Private><Vacancy /></Private>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <PageWipe />
      <Toasts />
      <Cursor />
    </MotionConfig>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
