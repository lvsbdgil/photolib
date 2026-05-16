# ── Stage 1: build frontend ───────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ── Stage 2: production deps (native modules compiled here) ───────────────────
FROM node:20-slim AS deps

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 3: final image ──────────────────────────────────────────────────────
FROM node:20-slim AS runner

RUN groupadd -r appgroup && useradd -r -g appgroup appuser

WORKDIR /app

# Copy production node_modules (compiled native addons included)
COPY --from=deps /app/node_modules ./node_modules

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server source
COPY server.js package.json ./

# Create persistent dirs and set ownership
RUN mkdir -p data uploads && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]
