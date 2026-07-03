#!/bin/bash

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker exec ilease-postgres pg_isready > /dev/null 2>&1
do
    sleep 2
    echo "Waiting for PostgreSQL..."
done

echo "PostgreSQL is ready. Running database migrations..."

# Run migrations
docker exec ilease-backend npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "Migrations completed successfully. Seeding forum categories..."
    
    # Run the seed script
    docker exec ilease-backend npx tsx prisma/seed-forum-categories.ts
    
    if [ $? -eq 0 ]; then
        echo "✅ Forum categories seeded successfully!"
    else
        echo "❌ Failed to seed forum categories"
        exit 1
    fi
else
    echo "❌ Failed to run migrations"
    exit 1
fi