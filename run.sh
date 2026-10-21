#!/usr/bin/env bash
# Compila el frontend y el backend y arranca Criba en http://localhost:8080
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env ] && { set -a; . ./.env; set +a; }
export JWT_SECRET="${JWT_SECRET:-$(head -c 48 /dev/urandom | base64)}"
(cd frontend && npm install --no-audit --no-fund && npx vite build)
(cd backend && mvn -q -B package -DskipTests)
exec java -jar backend/target/criba-backend-0.1.0.jar
