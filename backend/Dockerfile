# ============================================================
# Ilé Àṣẹ Backend — Multi-stage Production Dockerfile
# ============================================================
# Build: docker build -f backend/Dockerfile -t ilu-ase-backend .
# Run:   docker run -p 8080:8080 --env-file .env ilu-ase-backend
# ============================================================

# ─── Stage 1: Install dependencies ──────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

# Copy monorepo root manifests for workspace resolution
COPY package.json package-lock.json ./

# Copy workspace manifests (needed for workspace hoisting)
COPY common/package.json ./common/package.json
COPY backend/package.json ./backend/package.json

# Create frontend stub so npm workspaces doesn't fail
RUN mkdir -p frontend && echo '{"name":"@ile-ase/frontend","version":"0.1.0","private":true}' > frontend/package.json

# Install ALL workspace dependencies (hoisted to root node_modules)
RUN npm ci --legacy-peer-deps 2>&1

# ─── Stage 2: Build application ─────────────────────────────
FROM deps AS builder

# Copy common workspace source and config
COPY common ./common

# Build @ile-ase/common (backend imports from this workspace package)
RUN cd common && npx tsc && echo "=== Common built ===" && ls -la dist/

# Debug: verify workspace symlink
RUN ls -la node_modules/@ile-ase/ && ls -la node_modules/@ile-ase/common/ 2>/dev/null || echo "No @ile-ase/common in node_modules"

# Copy backend source and config
COPY backend/src ./backend/src
COPY backend/prisma ./backend/prisma
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/tsconfig.build.json ./backend/tsconfig.build.json
COPY backend/nest-cli.json ./backend/nest-cli.json
COPY backend/build.js ./backend/build.js
COPY backend/webpack.config.js ./backend/webpack.config.js

# Generate Prisma client (requires schema)
RUN cd backend && npx prisma generate

# Build NestJS application
RUN cd backend && npx nest build

# ─── Stage 3: Production runtime ────────────────────────────
FROM node:22-alpine AS production

# Security: run as non-root user
RUN addgroup -g 1001 nestjs && \
    adduser -u 1001 -G nestjs -s /bin/sh -D nestjs

WORKDIR /app

# Install runtime OS dependencies (openssl required by Prisma engine)
RUN apk add --no-cache \
    netcat-openbsd \
    dumb-init \
    openssl \
    && rm -rf /var/cache/apk/*

# Copy production artifacts from builder
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/backend/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/backend/prisma ./prisma
# Common workspace package (required for @ile-ase/common runtime resolution)
COPY --from=builder --chown=nestjs:nestjs /app/common/package.json ./common/package.json
COPY --from=builder --chown=nestjs:nestjs /app/common/dist ./common/dist

# Copy entrypoint script and fix line endings
COPY backend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh

# Minimal package.json for CommonJS module resolution
RUN echo '{"name":"ilu-ase-backend","version":"0.1.0","private":true}' > package.json && \
    chown nestjs:nestjs package.json

# Drop to non-root user
USER nestjs

# NestJS default port
EXPOSE 8080

# Use dumb-init to handle PID 1 signal forwarding
ENTRYPOINT ["dumb-init", "--"]
CMD ["./docker-entrypoint.sh"]
