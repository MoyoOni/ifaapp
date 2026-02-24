#!/bin/bash

# Database Migration Script
# Runs Prisma migrations for the backend

echo "🔄 Running database migrations..."

cd backend
npx prisma migrate dev --name init

echo "✅ Migrations completed!"
