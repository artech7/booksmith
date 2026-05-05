# Stage 1: Build the React frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Production image
FROM node:22-alpine AS production
WORKDIR /app

COPY backend/package*.json ./
RUN npm ci --only=production

COPY backend/ .
COPY --from=frontend-builder /build/dist ./public

RUN mkdir -p /data

EXPOSE 3000
ENV NODE_ENV=production
ENV DATA_DIR=/data

CMD ["node", "server.js"]
