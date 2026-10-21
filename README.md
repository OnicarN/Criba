# Criba · versión 0.1

Lee menos currículums y entiende mejor cada uno. Spring Boot 3 (Java 17) + React 18 (Vite) + Gemini.

## Arrancar

```bash
cp .env.example .env   # pon tu GEMINI_API_KEY
./run.sh               # compila todo y abre http://localhost:8080
```

Desarrollo con recarga en caliente: `cd backend && mvn spring-boot:run` y en otra terminal `cd frontend && npm run dev` (http://localhost:5173).

Con PostgreSQL: `docker compose up -d` y en `.env`
`DB_URL=jdbc:postgresql://localhost:5432/criba`, `DB_USER=criba`, `DB_PASSWORD=criba`.

## Qué está hecho

| Área | Requisitos |
|---|---|
| Cuentas | RF-01 a RF-04, contrato de encargo al registrarse (RL-01), bloqueo tras 5 intentos (RNF-05), borrado de cuenta (RD-06) |
| Vacantes | Crear, listar, editar (RF-13), archivar (RF-14), eliminar con confirmación en la fila (RF-12) |
| Análisis | PDF, TXT y DOCX (RF-20, RF-25), aviso de PDF escaneado (RF-21), cada archivo por separado con progreso (RF-23), reintentar (RF-27), reintentos ante límites de Gemini (RI-05), versión de modelo e instrucciones guardada (RD-04) |
| Resultados | Ranking (RF-30), informe (RF-31), borrar análisis (RF-32), CSV y PDF (RF-33), filtros que se mantienen (RF-34), comparar (RF-35), estado y notas (RF-36) |
| Planes | Página de planes (RF-40), límites aplicados en el servidor (RF-42, RP-01, RP-06), aviso al 80 % (RP-02), panel de consumo (RF-44), cambio de plan sin cobro |
| Seguridad | BCrypt, JWT 24 h, aislamiento entre cuentas (404), CORS, CSP, la clave de IA solo en el servidor, fuentes servidas desde el propio dominio (RL-10) |

Pendiente: pasarela de pago (RF-43), recuperación de contraseña y verificación de email (RF-05, RF-06; requieren servidor de correo), varios usuarios por cuenta (RF-07), OCR (RF-26), Flyway (RNF-22), borrado automático por plazo (RD-05) y textos legales definitivos (RL-02).

## Movimiento

La web tiene transiciones entre páginas, sacudidas de pantalla, ondas y partículas. Todo se desactiva si el sistema tiene activado "reducir movimiento".
