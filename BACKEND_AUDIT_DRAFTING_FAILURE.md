# Backend Audit: Drafting Failure Root Cause

## Root Cause

**Database schema mismatch**: The `jobs` table is missing `drafts_created` and `total_targets` columns that the SQLAlchemy model and application code assume exist. An Alembic migration exists (`add_job_progress_columns`) but was never applied to production.

---

## Failure Chain

### Step 1: User Action
- User clicks "Start Drafting" → Frontend calls `POST /api/pipeline/draft`

### Step 2: Job Creation Attempt
- **File**: `backend/app/api/pipeline.py:632-648`
- **Code**:
  ```python
  job = Job(
      job_type="draft",
      status="pending",
      drafts_created=0,      # ← FAILS: Column doesn't exist
      total_targets=None    # ← FAILS: Column doesn't exist
  )
  db.add(job)
  await db.commit()  # ← SQLAlchemy INSERT fails here
  ```

### Step 3: Database Error
- **Error**: `asyncpg.exceptions.UndefinedColumnError: column jobs.drafts_created does not exist`
- **Location**: SQLAlchemy ORM → asyncpg driver → PostgreSQL
- **Impact**: Transaction aborted, job record not inserted

### Step 4: Exception Handling
- **File**: `backend/app/api/pipeline.py:649-658`
- **Action**: Exception caught, `db.rollback()` executed, `HTTPException(500)` raised
- **Response**: Frontend receives HTTP 500 with error detail

### Step 5: Background Task Never Starts
- **File**: `backend/app/api/pipeline.py:660-692`
- **Status**: Code never reaches this block because `job_id` is undefined (job creation failed)
- **Impact**: `draft_prospects_async()` is never called, no drafts generated

### Step 6: No Drafts Persisted
- **File**: `backend/app/tasks/drafting.py:115-168`
- **Status**: Task never executes
- **Impact**: No `prospect.draft_subject` or `prospect.draft_body` values written to database

### Step 7: Frontend Shows Empty State
- **File**: `frontend/components/DraftsTable.tsx:64-143`
- **Query**: `GET /api/prospects?skip=0&limit=1000`
- **Filter**: `draft_subject.trim().length > 0 AND draft_body.trim().length > 0`
- **Result**: Zero prospects match filter → "No drafts found" displayed

### Step 8: Jobs Endpoint Also Fails
- **File**: `backend/app/api/jobs.py:36-64`
- **Query**: `select(Job)` → SQLAlchemy loads all columns
- **Serialization**: `JobResponse.model_validate(job)` accesses `drafts_created` and `total_targets`
- **Error**: Same `UndefinedColumnError` when accessing missing columns
- **Mitigation**: Error handler returns empty list (line 74-82), but this masks the real problem

---

## Why Nothing Appears in the UI

**Primary reason**: No drafts exist because the drafting job never starts.

1. **Job creation fails** → HTTP 500 returned to frontend
2. **Background task never scheduled** → No `draft_prospects_async()` execution
3. **No database writes** → `prospects.draft_subject` and `prospects.draft_body` remain NULL
4. **Frontend filter excludes all prospects** → `draft_subject.trim().length > 0` fails for NULL values
5. **Empty state displayed** → "No drafts found" message shown

**Secondary reason**: Progress polling fails silently.

- Frontend polls `GET /api/pipeline/draft/jobs/{job_id}` for progress updates
- If job creation succeeded but progress updates fail, polling would show no progress
- However, job creation fails first, so this is not the primary issue

---

## Exact Fix

### Option 1: Apply Alembic Migration (Recommended)

**Command**:
```bash
cd backend
alembic upgrade head
```

**Migration File**: `backend/alembic/versions/add_job_progress_columns.py`
- **Revision**: `add_job_progress_columns`
- **Down Revision**: `de8b5344821d` (merge point)
- **Idempotent**: Yes (checks for existing columns before adding)

**What It Does**:
```sql
-- If drafts_created doesn't exist:
ALTER TABLE jobs ADD COLUMN drafts_created INTEGER NOT NULL DEFAULT 0;
UPDATE jobs SET drafts_created = 0 WHERE drafts_created IS NULL;

-- If total_targets doesn't exist:
ALTER TABLE jobs ADD COLUMN total_targets INTEGER;
```

### Option 2: Manual SQL (If Alembic Fails)

**Direct SQL**:
```sql
-- Check current state
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name IN ('drafts_created', 'total_targets');

-- Add missing columns
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS drafts_created INTEGER NOT NULL DEFAULT 0;

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS total_targets INTEGER;

-- Verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name IN ('drafts_created', 'total_targets');
```

**Expected Output**:
```
drafts_created | integer | NO  | 0
total_targets  | integer | YES | NULL
```

### Verification

**After applying fix, verify**:
```python
# In Python shell or test script
from app.db.database import AsyncSessionLocal
from app.models.job import Job
from sqlalchemy import select

async with AsyncSessionLocal() as db:
    # This should NOT raise UndefinedColumnError
    result = await db.execute(select(Job).limit(1))
    job = result.scalar_one_or_none()
    if job:
        print(f"drafts_created: {job.drafts_created}")
        print(f"total_targets: {job.total_targets}")
```

---

## Migration Strategy

### Current State
- **Migration exists**: `add_job_progress_columns.py` is present in codebase
- **Not applied**: Production database schema doesn't match migration
- **Auto-migrate**: Disabled or failed (smart mode didn't detect mismatch)

### Recommended Approach

**1. Immediate Fix (Production)**:
```bash
# On production server (Render shell or SSH)
cd /path/to/backend
alembic upgrade head
```

**2. Verify Migration Applied**:
```bash
# Check Alembic version table
psql $DATABASE_URL -c "SELECT version_num FROM alembic_version;"

# Should show: add_job_progress_columns
```

**3. Prevent Future Issues**:
- Set `AUTO_MIGRATE=true` in production environment variables
- OR implement startup schema validation (see guardrail below)

---

## Should Backend Fail Fast on Missing Migrations?

**Answer: YES, but only at startup, not per-request.**

**Rationale**:
- Per-request checks add latency and complexity
- Startup checks catch schema mismatches before serving traffic
- Fail-fast prevents silent data corruption

**Implementation**:
- Add startup schema validation (see guardrail below)
- If validation fails, exit with non-zero code
- Deployment platform (Render/Railway) will prevent unhealthy service from receiving traffic

**Alternative (if startup checks are not possible)**:
- Keep current error handling in `jobs.py` (returns empty list on schema error)
- But add explicit logging: "SCHEMA MISMATCH: Run migrations"
- Monitor logs for this warning and alert on it

---

## One Hard Guardrail Recommendation

### Startup Schema Validation

**File**: `backend/app/main.py` (add to startup event)

**Code**:
```python
@app.on_event("startup")
async def validate_schema():
    """
    Hard guardrail: Validate critical columns exist before serving traffic.
    Fails fast if schema mismatch detected.
    """
    from sqlalchemy import text, inspect
    from app.db.database import engine
    
    required_columns = {
        'jobs': ['drafts_created', 'total_targets'],
        'prospects': ['draft_subject', 'draft_body', 'draft_status'],
    }
    
    async with engine.begin() as conn:
        for table_name, columns in required_columns.items():
            for column_name in columns:
                result = await conn.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = :table_name 
                    AND column_name = :column_name
                """), {"table_name": table_name, "column_name": column_name})
                
                if not result.fetchone():
                    error_msg = (
                        f"SCHEMA VALIDATION FAILED: "
                        f"Table '{table_name}' missing column '{column_name}'. "
                        f"Run migrations: alembic upgrade head"
                    )
                    logger.error(f"❌ {error_msg}")
                    raise RuntimeError(error_msg)
    
    logger.info("✅ Schema validation passed - all required columns exist")
```

**Behavior**:
- Runs once at application startup
- Checks for critical columns that code assumes exist
- Raises `RuntimeError` if any column is missing
- Application exits with non-zero code
- Deployment platform marks service as unhealthy
- Prevents serving traffic with broken schema

**Why This Works**:
- Catches schema mismatches before first request
- Forces deployment to fail if migrations not applied
- No performance impact (runs once at startup)
- Clear error message tells operator exactly what to fix

**Alternative (Lighter Weight)**:
If startup validation is too strict, add a health check endpoint that validates schema and returns 503 if mismatch detected:

```python
@app.get("/api/health/schema")
async def health_check_schema():
    """Health check that validates schema - returns 503 if mismatch"""
    # Same validation logic as above
    # Return 200 if OK, 503 if schema mismatch
```

Then configure load balancer to check this endpoint before routing traffic.

---

## Summary

**Root Cause**: Missing database columns (`drafts_created`, `total_targets`) cause job creation to fail immediately.

**Fix**: Apply migration `alembic upgrade head` or run manual SQL to add columns.

**Prevention**: Add startup schema validation that fails fast if required columns are missing.

**Impact**: Once fixed, drafting will work end-to-end: job creation → background task → draft persistence → UI display.

