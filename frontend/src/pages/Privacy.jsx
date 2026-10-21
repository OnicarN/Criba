import { Page } from '../components/Layout.jsx';
import { InfoNote, Reveal } from '../components/ui.jsx';

export default function Privacy() {
  return (
    <Page title="Privacidad y datos">
      <div className="container" style={{ paddingTop: 48, paddingBottom: 88, maxWidth: 760 }}>
        <Reveal style={{ display: 'grid', gap: 20 }}>
          <p className="overline">Privacidad y datos</p>
          <h1>Cómo trata Criba los datos</h1>
          <InfoNote>
            Borrador pendiente de revisión jurídica. La política de privacidad, los términos de uso y el contrato de encargo definitivos están <strong>por definir</strong>.
          </InfoNote>
          <h2 style={{ fontSize: 26 }}>Papeles</h2>
          <p>Tu empresa decide para qué se usan los currículums y es la responsable del tratamiento. Criba actúa como encargada y solo trata los datos siguiendo tus instrucciones. El proveedor de IA (Google, API de Gemini) es subencargado de Criba.</p>
          <h2 style={{ fontSize: 26 }}>Qué guardamos</h2>
          <ul>
            <li>De tu cuenta: email, nombre de empresa, plan y la contraseña cifrada con BCrypt.</li>
            <li>De cada vacante: puesto, descripción y requisitos.</li>
            <li>De cada candidato: solo el resultado del análisis. <strong>El archivo del CV no se guarda.</strong></li>
          </ul>
          <h2 style={{ fontSize: 26 }}>Qué no hace Criba</h2>
          <ul>
            <li>No descarta ni contacta a ningún candidato: decide siempre una persona.</li>
            <li>No usa sexo, edad, origen, estado civil ni otros rasgos protegidos para puntuar.</li>
            <li>No infiere emociones, ideas ni salud de las personas.</li>
          </ul>
          <h2 style={{ fontSize: 26 }}>Lo que te toca a ti</h2>
          <p>Informar a tus candidatos de que usas una herramienta de IA para la primera lectura y tener base legal para tratar sus CVs (arts. 13 y 14 RGPD).</p>
          <h2 style={{ fontSize: 26 }}>Tus derechos y los de tus candidatos</h2>
          <p>Puedes borrar el análisis de cualquier persona desde su informe, borrar una vacante con todos sus análisis o borrar tu cuenta entera desde Mis vacantes.</p>
          <p className="muted">Conservación de datos con borrado automático: por definir (propuesta, 6 meses).</p>
        </Reveal>
      </div>
    </Page>
  );
}
