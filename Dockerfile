# ── Stage 1: build the Vite frontend ──────────────────────────────────────────
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: production image ─────────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

# Only install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy the built frontend and the server
COPY --from=builder /app/dist ./dist
COPY server ./server

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/index.js"]
