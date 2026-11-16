# --- Stage 1: Build Frontend Client ---
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# --- Stage 2: Build Backend Server ---
FROM node:22-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# --- Stage 3: Production Runner ---
FROM node:22-alpine AS runner
WORKDIR /app

# Cài đặt ffmpeg phục vụ ghép nối âm thanh
RUN apk add --no-cache ffmpeg

ENV NODE_ENV=production
ENV PORT=6969
ENV TTS_BASE_URL=http://vieneu.vcntt.tech/v1

WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev

COPY --from=server-builder /app/server/dist ./dist
COPY --from=client-builder /app/client/dist /app/client/dist

# Tạo thư mục cache âm thanh
RUN mkdir -p /app/server/cache

EXPOSE 6969

CMD ["node", "dist/index.js"]
