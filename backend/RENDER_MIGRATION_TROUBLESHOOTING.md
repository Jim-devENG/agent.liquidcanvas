# Render Migration Troubleshooting Guide

## Problem: Social Outreach Tables Not Created

If you're seeing `503 Service Unavailable` with "social schema not initialized", the social tables haven't been created in the database.

## Quick Fix: Manual Migration on Render

### Step 1: Access Render Shell
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service
3. Click on **"Shell"** tab (or use the terminal icon)

### Step 2: Run Migrations
Try these commands in order:

```bash
# Option 1: If alembic.ini is in /app
cd /app
alembic upgrade head

# Option 2: If alembic.ini is in /app/backend
cd /app/backend
alembic upgrade head

# Option 3: Find alembic.ini first
find /app -name "alembic.ini"
# Then cd to that directory and run:
alembic upgrade head
```

### Step 3: Verify Tables Created
```bash
# Connect to PostgreSQL and check tables
psql $DATABASE_URL -c "\dt social_*"
```

You should see:
- `social_profiles`
- `social_discovery_jobs`
- `social_drafts`
- `social_messages`

## Why This Happens

1. **Prestart Script Not Running**: The `prestart.sh` script might not be configured in Render
2. **Migration Errors**: Migrations might be failing silently
3. **Wrong Directory**: Alembic might not find `alembic.ini` in the expected location

## Permanent Fix: Configure Prestart Script

### In Render Dashboard:
1. Go to your service settings
2. Find **"Prestart Command"** or **"Start Command"**
3. Set it to:
   ```bash
   bash prestart.sh && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
   OR if your structure is different:
   ```bash
   cd backend && bash prestart.sh && cd .. && uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### Verify Prestart Script Location
The `prestart.sh` file should be in your repository root or `backend/` directory.

## Verify Migrations Ran

After running migrations manually, check the logs:
```bash
# In Render Shell
alembic current
```

This shows the current migration version. It should show the latest social migration.

## Test After Migration

1. Restart your Render service
2. Check `/api/health/schema` endpoint
3. It should show `"social_tables": {"valid": true}`

## Still Not Working?

1. **Check Migration Files Exist**:
   ```bash
   ls -la /app/backend/alembic/versions/add_social*.py
   ```

2. **Check Alembic Configuration**:
   ```bash
   cat /app/backend/alembic.ini | grep sqlalchemy.url
   ```

3. **Run Migration with Verbose Output**:
   ```bash
   alembic upgrade head --verbose
   ```

4. **Check Database Connection**:
   ```bash
   echo $DATABASE_URL
   ```

## Prevention

To prevent this in the future:
1. Ensure `prestart.sh` is executable: `chmod +x prestart.sh`
2. Test migrations locally before deploying
3. Monitor Render logs during deployment
4. Set up health checks that verify table existence

