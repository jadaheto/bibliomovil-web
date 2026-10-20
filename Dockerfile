# ---- Construcción ----------------------------------------------------------
FROM node:24-alpine AS build
ARG API_URL=http://localhost:3000/api
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
# Sustituye la URL de la API en el entorno de producción antes de compilar.
RUN sed -i "s#__API_URL__#${API_URL}#" src/environments/environment.ts && npm run build

# ---- Servidor estático (nginx) ---------------------------------------------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/bibliomovil-web/browser /usr/share/nginx/html
EXPOSE 80
