# How to Run the Column Fix Script

## Quick Answer

**Script**: `backend/add_job_columns_direct.py`  
**Where**: On your Render server (where your backend is deployed)  
**How**: Via Render Shell

---

## Step-by-Step Instructions

### Option 1: Render Shell (Recommended)

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Find your backend service (the one running FastAPI)

2. **Open Shell**
   - Click on your backend service
   - Click "Shell" tab (or "Logs" → "Shell")
   - This opens a terminal connected to your Render server

3. **Navigate to backend directory**
   ```bash
   cd backend
   ```

4. **Run the script**
   ```bash
   python add_job_columns_direct.py
   ```

5. **Verify it worked**
   - You should see: `✅ SUCCESS: All columns added successfully!`
   - If columns already exist, you'll see: `ℹ️  column already exists`

6. **Restart your backend**
   - Go back to Render dashboard
   - Click "Manual Deploy" → "Clear build cache & deploy" (or just restart)

---

### Option 2: Local Machine (If you have DATABASE_URL)

**Only works if your local machine can connect to the production database**

1. **Set DATABASE_URL environment variable**
   ```bash
   # Windows PowerShell
   $env:DATABASE_URL = "your-production-database-url"
   
   # Windows CMD
   set DATABASE_URL=your-production-database-url
   
   # Mac/Linux
   export DATABASE_URL="your-production-database-url"
   ```

2. **Navigate to project**
   ```bash
   cd C:\Users\MIKENZY\Documents\Apps\liquidcanvas\backend
   ```

3. **Run script**
   ```bash
   python add_job_columns_direct.py
   ```

---

## What the Script Does

1. ✅ Checks if `drafts_created` column exists
2. ✅ Adds it if missing (with default value 0)
3. ✅ Checks if `total_targets` column exists
4. ✅ Adds it if missing (nullable)
5. ✅ Verifies both columns exist
6. ✅ Safe to run multiple times (won't duplicate columns)

---

## Expected Output

**If columns are missing:**
```
🔧 Adding missing columns to jobs table...
📝 This script adds: drafts_created, total_targets

📊 Existing columns: set()
➕ Adding drafts_created column...
✅ Added drafts_created column
➕ Adding total_targets column...
✅ Added total_targets column

✅ Verification:
   drafts_created: integer (nullable: NO, default: 0)
   total_targets: integer (nullable: YES, default: None)

✅ SUCCESS: All columns added successfully!
💡 You can now restart your backend - drafting should work.
```

**If columns already exist:**
```
📊 Existing columns: {'drafts_created', 'total_targets'}
ℹ️  drafts_created column already exists
ℹ️  total_targets column already exists

✅ Verification:
   drafts_created: integer (nullable: NO, default: 0)
   total_targets: integer (nullable: YES, default: None)

✅ SUCCESS: All columns added successfully!
```

---

## Troubleshooting

**Error: "DATABASE_URL environment variable not set"**
- Make sure you're running on Render (it has DATABASE_URL set automatically)
- Or set it manually if running locally

**Error: "Unsupported database URL format"**
- The script expects PostgreSQL URL
- Should start with `postgresql://` or `postgresql+asyncpg://`

**Error: "Connection refused"**
- Database might be paused (Render free tier)
- Check Render dashboard → Database → Status

---

## After Running

1. ✅ Script completes successfully
2. ✅ Restart your backend service on Render
3. ✅ Try "Start Drafting" again
4. ✅ Drafts should now appear in the UI

