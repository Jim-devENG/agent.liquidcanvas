# Drafting Flow Diagnostic Report

## 1. Drafting Flow Trace

### UI → Backend Call Chain

**Step 1: UI Click**
- **Component**: `frontend/components/Pipeline.tsx` (line 209-253) OR `frontend/components/DraftsTable.tsx` (line 146-246)
- **Action**: User clicks "Start Drafting" button
- **Function**: `handleDraft()` or `handleAutoDraft()`
- **API Call**: `pipelineDraft()` (no `prospect_ids` parameter = automatic mode)

**Step 2: Frontend API Call**
- **File**: `frontend/lib/api.ts` (line 1217-1270)
- **Function**: `pipelineDraft(request?: PipelineDraftRequest)`
- **Endpoint**: `POST /api/pipeline/draft`
- **Request Body**: `{}` (empty object when no prospect_ids provided)
- **Response Expected**: `{ success: true, job_id: UUID, message: string, prospects_count: number }`

**Step 3: Backend Endpoint**
- **File**: `backend/app/api/pipeline.py` (line 591-714)
- **Function**: `draft_emails(request: DraftRequest)`
- **Flow**:
  1. Checks master switch (line 613-627)
  2. Creates `Job` record immediately (line 632-648):
     - `job_type = "draft"`
     - `status = "pending"`
     - `drafts_created = 0` ← **CRITICAL: Assumes column exists**
     - `total_targets = None` ← **CRITICAL: Assumes column exists**
  3. Commits job to database (line 645-647)
  4. Starts background task `draft_prospects_async(job_id)` (line 662-668)
  5. Returns immediately with `job_id` (line 695-700)

**Step 4: Background Task**
- **File**: `backend/app/tasks/drafting.py` (line 21-200)
- **Function**: `draft_prospects_async(job_id: str)`
- **Flow**:
  1. Fetches job from database (line 36-41)
  2. Sets `job.status = "running"` (line 44-46)
  3. Queries prospects (line 48-92):
     - **Auto mode**: `verification_status='verified' AND contact_email IS NOT NULL AND source_type='website'`
     - **Manual mode**: Uses provided `prospect_ids`
  4. Sets `job.total_targets = len(prospects)` (line 95) ← **CRITICAL: Assumes column exists**
  5. Sets `job.drafts_created = 0` (line 96) ← **CRITICAL: Assumes column exists**
  6. For each prospect (line 115-168):
     - Calls Gemini API to generate draft (line 131-137)
     - Sets `prospect.draft_subject` and `prospect.draft_body` (line 140-141)
     - Sets `prospect.draft_status = "drafted"` (line 142)
     - Increments `job.drafts_created` (line 146) ← **CRITICAL: Assumes column exists**
     - Commits after each draft (line 147-148)
  7. Sets `job.status = "completed"` (line 171)

**Step 5: Frontend Polling**
- **Component**: `frontend/components/DraftsTable.tsx` (line 247-295)
- **Function**: `startPollingProgress(jobId: string)`
- **Endpoint**: `GET /api/pipeline/draft/jobs/{job_id}`
- **Frequency**: Every 3 seconds
- **Expected Response**: `{ job_id, status, total_targets, drafts_created, started_at, updated_at, error_message }`

**Step 6: Frontend Display**
- **Component**: `frontend/components/DraftsTable.tsx` (line 64-143)
- **Function**: `loadDrafts()`
- **API Call**: `GET /api/prospects?skip=0&limit=1000`
- **Filter Logic** (line 86-90):
  ```typescript
  const draftedProspects = allProspects.filter((p: Prospect) => {
    const hasSubject = p.draft_subject && p.draft_subject.trim().length > 0
    const hasBody = p.draft_body && p.draft_body.trim().length > 0
    return hasSubject && hasBody
  })
  ```
- **Display Condition**: Shows drafts if `draftedProspects.length > 0`

---

## 2. Jobs Table Reality vs Assumptions

### Columns Assumed to Exist (by Code)

**In `backend/app/models/job.py` (line 23-24):**
- `drafts_created = Column(Integer, default=0)` ← **ASSUMED**
- `total_targets = Column(Integer, nullable=True)` ← **ASSUMED**

**In `backend/app/api/pipeline.py` (line 640-641):**
- `drafts_created=0` ← **ASSUMED**
- `total_targets=None` ← **ASSUMED**

**In `backend/app/tasks/drafting.py` (line 95-96, 146):**
- `job.total_targets = len(prospects)` ← **ASSUMED**
- `job.drafts_created = 0` ← **ASSUMED**
- `job.drafts_created = drafted_count` ← **ASSUMED**

**In `backend/app/api/pipeline.py` (line 759-760):**
- `total_targets=job.total_targets` ← **ASSUMED**
- `drafts_created=job.drafts_created or 0` ← **ASSUMED**

**In `backend/app/schemas/job.py` (line 26-27):**
- `drafts_created: int = 0` ← **ASSUMED**
- `total_targets: Optional[int] = None` ← **ASSUMED**

### Columns Actually Queried

**In `backend/app/api/jobs.py` (line 36-59):**
- `select(Job)` ← **Queries ALL columns, including `drafts_created` and `total_targets`**
- **Error Handling** (line 74-82): Catches `UndefinedColumnError` for `drafts_created`/`total_targets` and returns empty list

**In `backend/app/api/pipeline.py` (line 750):**
- `select(Job).where(Job.id == job_id, Job.job_type == "draft")` ← **Queries ALL columns**

### Database Schema Reality

**Migration File**: `backend/alembic/versions/add_job_progress_columns.py`
- **Status**: Migration exists but may not have been applied
- **Columns Added**:
  - `drafts_created INTEGER NOT NULL DEFAULT 0`
  - `total_targets INTEGER NULLABLE`

**Confirmed Error**: `asyncpg.exceptions.UndefinedColumnError: column jobs.drafts_created does not exist`
- **This proves**: Migration has NOT been applied to production database
- **Impact**: Any query that selects `Job` columns will fail when accessing `drafts_created` or `total_targets`

---

## 3. Drafts Existence Check

### Are Drafts Actually Created?

**Backend Drafting Task** (`backend/app/tasks/drafting.py`):
- **Line 140-142**: Sets `prospect.draft_subject`, `prospect.draft_body`, and `prospect.draft_status = "drafted"`
- **Line 147**: Commits after each draft
- **Conclusion**: **Drafts ARE created** if Gemini API succeeds

**Database Writes**:
- **Table**: `prospects`
- **Columns Updated**:
  - `draft_subject` (Text)
  - `draft_body` (Text)
  - `draft_status` (String, set to "drafted")

**Frontend Filter** (`frontend/components/DraftsTable.tsx` line 86-90):
- **Condition**: `draft_subject.trim().length > 0 AND draft_body.trim().length > 0`
- **Query**: `GET /api/prospects?skip=0&limit=1000`
- **Backend Endpoint**: `backend/app/api/prospects.py` (line 1223-1443)
- **Response Includes**: `draft_subject` and `draft_body` (line 1430-1431)

**Answer**: **Drafts ARE created** (assuming Gemini API succeeds and job completes). However, they may not be visible if:
1. Job fails before completing (due to `drafts_created` column error)
2. Frontend filter excludes them (if `draft_subject` or `draft_body` is empty/null)
3. API returns 500 error before drafts can be queried

---

## 4. Frontend Render Gate Conditions

### Exact Conditions for Drafts to Render

**Component**: `frontend/components/DraftsTable.tsx`

**Step 1: Load Drafts** (line 64-143)
- **API Call**: `listProspects(0, 1000)` → `GET /api/prospects?skip=0&limit=1000`
- **Success Condition**: Response must have `data` array
- **Error Handling**: Sets `error` state but does NOT clear `prospects` (line 133-142)

**Step 2: Filter Drafts** (line 86-90)
- **Condition**: `draft_subject.trim().length > 0 AND draft_body.trim().length > 0`
- **Result**: `draftedProspects` array

**Step 3: Render Logic** (line 400-424 in `frontend/app/dashboard/page.tsx`)
```typescript
{activeTab === 'drafts' && (
  <div className="max-w-7xl mx-auto">
    {(() => {
      try {
        return <DraftsTable />
      } catch (error: any) {
        return <div>Error Loading Drafts</div>
      }
    })()}
  </div>
)}
```

**Step 4: Display Conditions** (inside `DraftsTable.tsx`)
- **If `error` exists**: Shows error message (line 300-310)
- **If `loading` is true**: Shows loading spinner (line 280-290)
- **If `prospects.length === 0`**: Shows "No drafts found" (line 320-330)
- **If `prospects.length > 0`**: Shows table with drafts (line 340-600)

**Dependencies**:
- **NO dependency on `jobs.status`** ← Frontend does NOT check job status
- **NO dependency on `jobs.drafts_created`** ← Frontend does NOT use this
- **NO dependency on `jobs.total_targets`** ← Frontend does NOT use this
- **ONLY dependency**: `prospect.draft_subject` and `prospect.draft_body` must be non-empty

**What Happens if Jobs Fetch Fails?**
- **Answer**: **Nothing** - Frontend does NOT depend on jobs endpoint for displaying drafts
- **Jobs endpoint** (`GET /api/jobs`) is only used for:
  - Job status panel (separate component)
  - Progress polling (shows progress bar, but doesn't block draft display)

---

## 5. Single Root Cause (Most Upstream Failure)

### Primary Failure Point

**Location**: `backend/app/api/pipeline.py` line 632-648

**Failure**: Job creation attempts to set `drafts_created=0` and `total_targets=None` on a `Job` model that assumes these columns exist, but the database schema does NOT have these columns.

**Error Chain**:
1. **User clicks "Start Drafting"** → `POST /api/pipeline/draft`
2. **Backend creates Job** (line 632-648):
   ```python
   job = Job(
       job_type="draft",
       status="pending",
       drafts_created=0,  # ← FAILS: Column doesn't exist
       total_targets=None  # ← FAILS: Column doesn't exist
   )
   ```
3. **SQLAlchemy tries to INSERT** → `asyncpg.exceptions.UndefinedColumnError: column jobs.drafts_created does not exist`
4. **Transaction fails** → Job is NOT created
5. **Background task never starts** → No drafts are generated
6. **Frontend shows "No drafts found"** → Because no drafts were ever created

### Secondary Failure Points (If Primary is Fixed)

**If job creation succeeds but background task fails**:
- **Location**: `backend/app/tasks/drafting.py` line 95-96, 146
- **Failure**: Task tries to update `job.total_targets` and `job.drafts_created` but columns don't exist
- **Impact**: Task crashes, job status never updates, but drafts may still be created (if task gets past line 95)

**If drafts are created but API fails**:
- **Location**: `backend/app/api/jobs.py` line 36-59
- **Failure**: `GET /api/jobs` tries to select all Job columns including `drafts_created`/`total_targets`
- **Impact**: Jobs endpoint returns 500, but drafts endpoint (`GET /api/prospects`) still works
- **Note**: Frontend does NOT depend on jobs endpoint for displaying drafts, so this is NOT the root cause

### Ranking by Earliest Causal Failure

1. **PRIMARY**: Job creation fails due to missing `drafts_created`/`total_targets` columns (line 632-648 in `pipeline.py`)
   - **Earliest**: Happens immediately on "Start Drafting" click
   - **Impact**: Job never created, background task never starts, no drafts generated

2. **SECONDARY**: Background task fails when updating job progress (line 95-96, 146 in `drafting.py`)
   - **Earliest**: Happens after job is created and task starts
   - **Impact**: Task crashes, but drafts may still be created before crash

3. **TERTIARY**: Jobs list endpoint fails (line 36-59 in `jobs.py`)
   - **Earliest**: Happens when frontend polls for job status
   - **Impact**: Progress bar doesn't update, but drafts are still visible (if they exist)

---

## Summary

**Root Cause**: Database schema mismatch - `jobs` table is missing `drafts_created` and `total_targets` columns that the code assumes exist.

**Evidence**:
- Error: `asyncpg.exceptions.UndefinedColumnError: column jobs.drafts_created does not exist`
- Migration exists but not applied: `backend/alembic/versions/add_job_progress_columns.py`
- Code assumes columns exist: Multiple locations in `pipeline.py`, `drafting.py`, `jobs.py`

**Impact**:
- Job creation fails → No drafts generated → Frontend shows "No drafts found"
- Jobs endpoint returns 500 → Progress polling fails (but doesn't block draft display)

**Fix Required**:
- Apply migration: `alembic upgrade head` OR manually add columns to `jobs` table
- Verify columns exist: `SELECT column_name FROM information_schema.columns WHERE table_name = 'jobs' AND column_name IN ('drafts_created', 'total_targets')`

