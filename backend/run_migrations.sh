#!/bin/bash
# Run Alembic migrations on Linux/Mac

set -e

echo "🔄 Running Alembic migrations..."
cd "$(dirname "$0")"

python run_migrations.py

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully!"
else
    echo "❌ Migration failed!"
    exit 1
fi
