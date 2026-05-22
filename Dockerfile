# ── Stage 1: Build the React + Vite frontend ─────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9 --quiet

# Copy workspace manifests first (better layer caching)
COPY pnpm-workspace.yaml package.json tsconfig.base.json tsconfig.json ./

# Copy all workspace package manifests
COPY lib/ ./lib/
COPY artifacts/medai-dashboard/ ./artifacts/medai-dashboard/

# Install all dependencies
RUN pnpm install --no-frozen-lockfile

# Build shared libs (composite TypeScript packages)
RUN pnpm run typecheck:libs

# Build the frontend (output → artifacts/medai-dashboard/dist/public)
ENV BASE_PATH=/
ENV PORT=3000
RUN pnpm --filter @workspace/medai-dashboard run build

# ── Stage 2: Lightweight runtime ─────────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

# Copy the production server (zero npm dependencies)
COPY server.js ./

# Copy built frontend assets
COPY --from=builder /app/artifacts/medai-dashboard/dist/public ./dist

# HuggingFace Spaces requires port 7860
ENV PORT=7860
EXPOSE 7860

CMD ["node", "server.js"]
