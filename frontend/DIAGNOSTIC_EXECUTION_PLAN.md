# Diagnostic Execution Plan - Production Incident

## Objective
Prove definitively which codebase is running in production and identify the root cause of missing UI changes.

## Step-by-Step Diagnosis

### STEP 1: Verify Vercel Project Configuration (5 minutes)

**Action:**
1. Log into https://vercel.com/dashboard
2. Open your frontend project
3. Go to **Settings → Git**

**Document:**
- [ ] Repository URL: `________________________`
- [ ] Branch: `________________________`
- [ ] Root Directory: `________________________`
- [ ] Auto-deploy: `[ ] Enabled  [ ] Disabled`

**Expected for monorepo:**
- Repository: `https://github.com/Jim-devENG/agent.liquidcanvas.git`
- Root Directory: `frontend`

**Expected for separate repo:**
- Repository: `https://github.com/Jim-devENG/agent-frontend.git`
- Root Directory: `.` (root)

**If mismatch found:** → **ROOT CAUSE IDENTIFIED: Wrong Repository or Root Directory**

---

### STEP 2: Verify Domain Configuration (2 minutes)

**Action:**
1. Vercel Dashboard → Project → **Settings → Domains**
2. Check production domain

**Document:**
- [ ] Production domain: `________________________`
- [ ] DNS configured: `[ ] Yes  [ ] No`
- [ ] SSL status: `[ ] Valid  [ ] Invalid`

**If domain points to wrong project:** → **ROOT CAUSE IDENTIFIED: Wrong Domain**

---

### STEP 3: Runtime Proof Test (2 minutes)

**Action:**
1. Open production site in browser
2. Open Developer Console (F12)
3. Run these commands:

```javascript
// Test 1: Check monorepo flag
window.__LIQUIDCANVAS_MONOREPO_ACTIVE__

// Test 2: Check repo proof
window.__REPO_PROOF__

// Test 3: Check runtime proof
window.__RUNTIME_PROOF__

// Test 4: Check dashboard proof
window.__DASHBOARD_RUNTIME_PROOF__

// Test 5: Check version
window.__DASHBOARD_VERSION__
```

**Expected Results (if monorepo frontend is running):**
- `window.__LIQUIDCANVAS_MONOREPO_ACTIVE__` = `true`
- `window.__REPO_PROOF__` = `"liquidcanvas-monorepo-frontend"`
- `window.__RUNTIME_PROOF__` = `"LIQUIDCANVAS-MONOREPO-..."` (timestamp)
- `window.__DASHBOARD_RUNTIME_PROOF__` = `"LIQUIDCANVAS-MONOREPO-DASHBOARD-..."` (timestamp)
- `window.__DASHBOARD_VERSION__` = `"4.0-DIAGNOSTIC"`

**Visual Check:**
- [ ] Bottom-left corner shows: `MONOREPO v4.0 | Build: ...`
- [ ] Console shows: `🚨🚨🚨 DASHBOARD CODE LOADED - VERSION 4.0-DIAGNOSTIC 🚨🚨🚨`

**If any test fails:** → **ROOT CAUSE IDENTIFIED: Wrong Codebase Running**

---

### STEP 4: Build Log Verification (3 minutes)

**Action:**
1. Vercel Dashboard → **Deployments** → Latest deployment
2. Click **Build Logs**
3. Search for: `Generating build ID`

**Document:**
- [ ] Build ID found: `[ ] Yes  [ ] No`
- [ ] Build ID value: `________________________`
- [ ] Build time logged: `[ ] Yes  [ ] No`
- [ ] Build errors: `[ ] None  [ ] Found`

**Check Root Directory in build:**
- Look for: `Installing dependencies...` or `cd frontend && npm install`
- If you see `cd frontend` → Root Directory is correct
- If you DON'T see `cd frontend` but should → Root Directory is wrong

**If build doesn't show frontend directory:** → **ROOT CAUSE IDENTIFIED: Wrong Root Directory**

---

### STEP 5: Hard Failure Test (5 minutes)

**Action:**
1. Make a visible change to `frontend/app/layout.tsx`:
   - Change `MONOREPO v4.0` to `MONOREPO v4.1-TEST`
2. Commit and push:
   ```bash
   cd C:\Users\MIKENZY\Documents\Apps\liquidcanvas
   git add frontend/app/layout.tsx
   git commit -m "TEST: Change version to 4.1-TEST for diagnostic"
   git push jim-frontend main
   ```
3. Wait for Vercel deployment (2-3 minutes)
4. Hard refresh production site (Ctrl+Shift+R)
5. Check bottom-left corner

**Expected:**
- Should see: `MONOREPO v4.1-TEST`

**If change doesn't appear:** → **ROOT CAUSE IDENTIFIED: Wrong Repository/Branch/Domain**

---

## Decision Tree

```
START
  │
  ├─→ Check Vercel Git Settings
  │     │
  │     ├─→ Repository = agent.liquidcanvas.git?
  │     │     │
  │     │     ├─→ YES → Check Root Directory
  │     │     │           │
  │     │     │           ├─→ Root = "frontend"?
  │     │     │           │     │
  │     │     │           │     ├─→ YES → Check Branch
  │     │     │           │     │           │
  │     │     │           │     │           ├─→ Branch = "main"?
  │     │     │           │     │           │     │
  │     │     │           │     │           │     ├─→ YES → Run Runtime Test
  │     │     │           │     │           │     │           │
  │     │     │           │     │           │     │           ├─→ Runtime proof exists?
  │     │     │           │     │           │     │           │     │
  │     │     │           │     │           │     │           │     ├─→ YES → ✅ CORRECT SETUP
  │     │     │           │     │           │     │           │     │
  │     │     │           │     │           │     │           │     └─→ NO → Check Build Logs
  │     │     │           │     │           │     │
  │     │     │           │     │           │     └─→ NO → ❌ WRONG BRANCH
  │     │     │           │     │
  │     │     │           │     └─→ NO → ❌ WRONG ROOT DIRECTORY
  │     │     │
  │     │     └─→ NO → ❌ WRONG REPOSITORY
  │
  └─→ Check Domain
        │
        ├─→ Domain points to this project?
        │     │
        │     ├─→ YES → Continue diagnosis
        │     │
        │     └─→ NO → ❌ WRONG DOMAIN
```

## Root Cause Identification

### Scenario A: Wrong Repository
**Symptoms:**
- Vercel connected to `agent-frontend` but code pushed to `liquidcanvas`
- Runtime proof tests fail
- Visual badge doesn't appear

**Fix:**
1. Vercel Dashboard → Settings → Git
2. Disconnect current repository
3. Connect to: `https://github.com/Jim-devENG/agent.liquidcanvas.git`
4. Set Root Directory: `frontend`
5. Redeploy

### Scenario B: Wrong Root Directory
**Symptoms:**
- Repository correct
- Build logs show building from root instead of `frontend/`
- Runtime proof tests fail

**Fix:**
1. Vercel Dashboard → Settings → General
2. Update Root Directory: `frontend`
3. Redeploy

### Scenario C: Wrong Branch
**Symptoms:**
- Repository correct
- Root Directory correct
- But deploying from wrong branch

**Fix:**
1. Vercel Dashboard → Settings → Git
2. Update Production Branch: `main` (or `master`)
3. Redeploy

### Scenario D: Wrong Domain
**Symptoms:**
- Vercel project correct
- But domain points to different project

**Fix:**
1. Check DNS records
2. Update Vercel domain configuration
3. Or update DNS to point to correct project

### Scenario E: Build Output Mismatch
**Symptoms:**
- Everything configured correctly
- But wrong files served

**Fix:**
1. Check Output Directory setting (should be `.next`)
2. Check Build Command (should be `npm run build`)
3. Review build logs for errors
4. Force redeploy

## Verification Checklist

After fixing the identified issue:

- [ ] Vercel repository matches codebase
- [ ] Root Directory set correctly
- [ ] Branch matches deployment branch
- [ ] Domain points to correct project
- [ ] Runtime proof tests pass
- [ ] Visual badge appears (`MONOREPO v4.0`)
- [ ] Console logs show correct version
- [ ] Hard refresh shows latest changes
- [ ] Build logs show correct directory
- [ ] Deployment triggered by git push

## Next Steps After Diagnosis

1. **Document findings** in this file
2. **Apply fix** based on root cause
3. **Verify fix** using runtime proof tests
4. **Remove diagnostic code** after confirmation
5. **Update deployment documentation** if needed

