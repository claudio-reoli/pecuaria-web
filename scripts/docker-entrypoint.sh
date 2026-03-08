#!/bin/sh
set -e
cd /app/backend
npx prisma db push --skip-generate 2>/dev/null || true
exec node /app/backend/dist/index.js
