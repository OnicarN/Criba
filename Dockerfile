# 1) Compila el frontend (React)
FROM node:22-alpine AS web
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npx vite build --outDir /app/static

# 2) Compila el backend (Spring Boot) con el frontend dentro
FROM maven:3.9-eclipse-temurin-17 AS api
WORKDIR /app/backend
COPY backend/pom.xml ./
RUN mvn -q -B dependency:go-offline
COPY backend/src ./src
COPY --from=web /app/static ./src/main/resources/static
RUN mvn -q -B package -DskipTests

# 3) Imagen final, solo con Java
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=api /app/backend/target/criba-backend-0.1.0.jar app.jar
ENV JAVA_OPTS="-Xmx320m"
EXPOSE 8080
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
