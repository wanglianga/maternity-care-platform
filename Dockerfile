FROM node:18-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install --production

COPY backend/ .

FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY frontend/package*.json ./
RUN npm install --production=false

COPY frontend/ .
RUN npm run build

FROM nginx:alpine AS runner
RUN apk add --no-cache nodejs npm curl

COPY --from=backend-builder /app/backend /app/backend
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

RUN sed -i 's|http://backend:3000|http://127.0.0.1:3000|g' /etc/nginx/conf.d/default.conf

WORKDIR /app/backend

EXPOSE 80

CMD sh -c "node /app/backend/app.js & nginx -g 'daemon off;'"
