#!/bin/bash
# Prestart script for Render deployment
# Runs database migrations before the application starts
# Render automatically executes this script before starting the app

set -e  # Exit on any error - if migrations fail, deployment fails

echo "=========================================="
echo "🚀 Running database migrations..."
echo "=========================================="

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Try different possible locations
if [ -f "$SCRIPT_DIR/alembic.ini" ]; then
    # We're in the backend directory
    cd "$SCRIPT_DIR"
elif [ -f "/app/backend/alembic.ini" ]; then
    # Render deployment structure
    cd /app/backend
elif [ -f "/app/alembic.ini" ]; then
    # Alternative Render structure
    cd /app
else
    echo "❌ ERROR: Could not find alembic.ini"
    echo "Current directory: $(pwd)"
    echo "Script directory: $SCRIPT_DIR"
    ls -la
    exit 1
fi

echo "📁 Working directory: $(pwd)"
echo "📝 Executing: alembic upgrade head"

# Run migrations
alembic upgrade head

echo "=========================================="
echo "✅ Database migrations completed successfully"
echo "=========================================="

