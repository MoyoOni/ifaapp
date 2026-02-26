FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace root files needed for monorepo install
COPY package*.json ./
COPY tsconfig.json ./
COPY nest-cli.json ./

# Copy common package (workspace dependency)
COPY ../common ./common

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source and prisma schema
COPY src ./src
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npx nest build

# ─── Production stage ───
FROM node:22-alpine

WORKDIR /app

# Install netcat for DB readiness check in entrypoint
RUN apk add --no-cache netcat-openbsd

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Copy entrypoint
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
