FROM node:18-alpine
WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p /app/data/db /app/uploads

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "app.js"]
