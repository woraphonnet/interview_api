#!/bin/sh

# รอ database พร้อม (optional)
echo "⏳ Waiting for database..."
while ! nc -z postgres 5432; do
  sleep 1
done

echo "📦 Running Prisma migrate..."
npx prisma generate
npx prisma migrate deploy

echo "🚀 Starting NestJS app"
node dist/main.js
