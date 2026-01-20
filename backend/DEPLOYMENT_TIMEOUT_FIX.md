# Deployment Timeout Fix

## Problem
Render deployment times out during "==> Deploying..." stage after successful build.

## Quick Fixes

### 1. Retry Deployment
Sometimes Render has temporary issues. Try deploying again:
- Go to Render Dashboard → Your Service → Manual Deploy → Deploy latest commit

### 2. Check Render Settings

**Health Check Path:**
- Settings → Health Check Path: `/health`
- Health Check Timeout: Increase to 300 seconds (5 minutes)

**Start Command:**
Make sure it's set to:
```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Prestart Command (if using):**
```bash
cd backend && bash prestart.sh
```

### 3. Check Logs
Look for:
- Migration errors in prestart.sh output
- Database connection timeouts
- Import errors
- Any hanging processes

### 4. If Migrations Are Hanging

If migrations are taking too long, you can:
1. Run migrations manually via Render Shell
2. Temporarily disable auto-migration in startup
3. Check database connection string is correct

### 5. Increase Timeout in Render

If your app legitimately takes time to start:
- Settings → Health Check Timeout: 300 seconds
- Settings → Auto-Deploy: Disable temporarily to prevent repeated timeouts

## Common Causes

1. **Database Connection Slow**: First connection to PostgreSQL can take 30-60 seconds
2. **Migrations Taking Long**: If many migrations, can take 2-5 minutes
3. **Import Errors**: Code trying to import modules that don't exist
4. **Resource Constraints**: Render free tier has limited resources

## Verify Deployment

After deployment succeeds:
1. Check `/health` endpoint returns `{"status": "healthy"}`
2. Check `/health/ready` endpoint returns database status
3. Test a simple API endpoint

