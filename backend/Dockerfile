# ============================================================
# Ilé Àṣẹ Backend — Multi-stage Production Dockerfile
# ============================================================
# Build: docker build -f backend/Dockerfile -t ilu-ase-backend .
# Run:   docker run -p 8080:8080 --env-file .env ilu-ase-backend
# ============================================================

# ─── Stage 1: Install all workspace deps ─────────────────────
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY common/package.json ./common/package.json
COPY frontend/package.json ./frontend/package.json

RUN npm ci --legacy-peer-deps 2>&1

# ─── Stage 2: Build application ──────────────────────────────
FROM deps AS builder

WORKDIR /app

COPY common/src ./common/src
COPY common/tsconfig.json ./common/tsconfig.json

RUN cd common && npx tsc \
    && echo "=== Common built ===" && ls -la dist/

COPY backend/src ./backend/src
COPY backend/prisma ./backend/prisma
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/tsconfig.build.json ./backend/tsconfig.build.json
COPY backend/nest-cli.json ./backend/nest-cli.json
COPY backend/build.js ./backend/build.js
COPY backend/webpack.config.js ./backend/webpack.config.js

RUN cd backend && npx prisma generate

RUN cd backend && npx nest build

# Merge backend workspace node_modules into root node_modules (in builder, as root)
# This avoids a slow chown -R in the production stage
RUN if [ -d ./backend/node_modules ] && [ "$(ls -A ./backend/node_modules 2>/dev/null)" ]; then \
      for pkg in ./backend/node_modules/[!@]*/; do \
        [ -d "$pkg" ] || continue; \
        name=$(basename "$pkg"); \
        [ -d "./node_modules/$name" ] || cp -r "$pkg" "./node_modules/$name"; \
      done; \
      for scope in ./backend/node_modules/@*/; do \
        [ -d "$scope" ] || continue; \
        scopename=$(basename "$scope"); \
        mkdir -p "./node_modules/$scopename"; \
        for spkg in "$scope"*/; do \
          [ -d "$spkg" ] || continue; \
          spkgname=$(basename "$spkg"); \
          [ -d "./node_modules/$scopename/$spkgname" ] || cp -r "$spkg" "./node_modules/$scopename/$spkgname"; \
        done; \
      done; \
    fi

# ─── Stage 3: Production runtime ────────────────────────────
FROM node:22-alpine AS production

RUN addgroup -g 1001 nestjs && \
    adduser -u 1001 -G nestjs -s /bin/sh -D nestjs

WORKDIR /app

RUN apk add --no-cache \
    netcat-openbsd \
    dumb-init \
    openssl \
    && rm -rf /var/cache/apk/*

# node_modules already merged in builder stage — single COPY, no chown -R needed
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/backend/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/backend/prisma ./prisma
COPY --from=builder --chown=nestjs:nestjs /app/common/package.json ./node_modules/@ile-ase/common/package.json
COPY --from=builder --chown=nestjs:nestjs /app/common/dist ./node_modules/@ile-ase/common/dist

COPY backend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh

RUN echo '{"name":"ilu-ase-backend","version":"0.1.0","private":true}' > package.json && \
    chown nestjs:nestjs package.json

USER nestjs

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["./docker-entrypoint.sh"]
