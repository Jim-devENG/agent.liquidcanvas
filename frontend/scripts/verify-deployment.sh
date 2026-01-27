#!/bin/bash
# Deployment Verification Script
# Run this before pushing to ensure deployment will work

set -e

echo "🔍 Verifying deployment configuration..."
echo ""

# Check vercel.json doesn't have rootDirectory
echo "1️⃣  Checking vercel.json..."
if grep -q "rootDirectory" vercel.json; then
  echo "   ❌ ERROR: vercel.json contains 'rootDirectory' - remove it!"
  echo "   Root directory must be set in Vercel dashboard, not in vercel.json"
  exit 1
fi
echo "   ✅ vercel.json is valid (no rootDirectory property)"

# Check correct remote exists
echo ""
echo "2️⃣  Checking git remotes..."
if ! git remote get-url jim-frontend 2>/dev/null | grep -q "Jim-devENG/agent-frontend"; then
  echo "   ❌ ERROR: jim-frontend remote is incorrect!"
  echo "   Expected: Jim-devENG/agent-frontend"
  git remote -v
  exit 1
fi
echo "   ✅ jim-frontend remote is correct"

# Check we're on main branch
echo ""
echo "3️⃣  Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "   ⚠️  WARNING: Not on main branch (currently on: $CURRENT_BRANCH)"
  echo "   Vercel production branch should be 'main'"
else
  echo "   ✅ On main branch"
fi

# Check package.json exists in root
echo ""
echo "4️⃣  Checking directory structure..."
if [ ! -f "package.json" ]; then
  echo "   ❌ ERROR: package.json not found in root"
  exit 1
fi
echo "   ✅ package.json exists in root"

if [ ! -d "app" ]; then
  echo "   ❌ ERROR: app/ directory not found in root"
  exit 1
fi
echo "   ✅ app/ directory exists in root"

# Check for nested frontend directory
if [ -d "frontend/app" ]; then
  echo "   ⚠️  WARNING: frontend/app/ exists"
  echo "   Ensure Vercel Root Directory is EMPTY, not '/frontend'"
fi

# Check next.config.js exists
if [ ! -f "next.config.js" ]; then
  echo "   ❌ ERROR: next.config.js not found in root"
  exit 1
fi
echo "   ✅ next.config.js exists in root"

# Check for uncommitted changes
echo ""
echo "5️⃣  Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
  echo "   ⚠️  WARNING: You have uncommitted changes"
  echo "   Consider committing before pushing"
else
  echo "   ✅ Working directory is clean"
fi

echo ""
echo "✅ All deployment checks passed!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify Vercel Root Directory is empty (Settings → General)"
echo "   2. Verify Vercel Repository is 'Jim-devENG/agent-frontend' (Settings → Git)"
echo "   3. Push: git push jim-frontend main"
echo "   4. After deployment, verify forensic markers appear in browser console"


