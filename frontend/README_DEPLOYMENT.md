# Deployment Guide - Critical Settings

## ⚠️ CRITICAL: Read This Before Deploying

This project has specific Vercel configuration requirements. **DO NOT** change these settings without understanding the impact.

---

## Required Vercel Settings

### 1. Root Directory
**Location:** Vercel Dashboard → Settings → General → Root Directory

**MUST BE:** Empty (blank) - **NOT** `/frontend` or anything else

**Why:** The repository root IS the frontend directory. The code structure is:
```
frontend/          ← Repository root (this is where Vercel should build from)
├── app/           ← Next.js app directory
├── components/    ← React components
├── package.json   ← Dependencies
└── next.config.js ← Next.js config
```

If Root Directory is set to `/frontend`, Vercel will look for `frontend/frontend/` which doesn't exist or is stale.

**How to Verify:**
1. Go to Vercel Dashboard
2. Settings → General
3. Check "Root Directory" field
4. **MUST BE:** Empty/blank

---

### 2. Repository Connection
**Location:** Vercel Dashboard → Settings → Git

**Repository MUST BE:** `Jim-devENG/agent-frontend`

**Production Branch MUST BE:** `main`

**Why:** Code is pushed to the `jim-frontend` remote which points to `Jim-devENG/agent-frontend`. If Vercel is connected to a different repository, it will deploy stale code.

**How to Verify:**
1. Go to Vercel Dashboard
2. Settings → Git
3. Check "Repository" field
4. **MUST BE:** `Jim-devENG/agent-frontend`
5. Check "Production Branch"
6. **MUST BE:** `main`

---

## Git Remote Setup

This project uses two remotes:

- **`jim-frontend`**: `https://github.com/Jim-devENG/agent-frontend.git` ✅ (Use this for deployments)
- **`origin`**: `git@github.com:liquidcanvasvideos/agent-frontend.git` (Different repo)

**Always push to:** `jim-frontend`

```bash
git push jim-frontend main
```

**Never push to:** `origin` (unless Vercel is reconfigured to watch it)

---

## Deployment Process

### Standard Deployment
```bash
# 1. Verify changes
cd frontend
git status

# 2. Commit changes
git add .
git commit -m "Your commit message"

# 3. Push to correct remote
git push jim-frontend main

# 4. Wait for Vercel deployment (2-5 minutes)

# 5. Verify deployment
# - Check browser console for: 🚨 FORENSIC MARKER: ROOT-DIRECTORY-BUILD-...
# - Check bottom-left for: ROOT-DIR indicator
```

### Pre-Deployment Verification
Run the verification script:
```bash
cd frontend
./scripts/verify-deployment.sh
```

Or manually check:
- [ ] `vercel.json` does NOT have `rootDirectory` property
- [ ] Pushing to `jim-frontend` remote
- [ ] On `main` branch
- [ ] Vercel Root Directory is empty (check dashboard)

---

## Post-Deployment Verification

After deployment completes, verify:

1. **Build Logs:**
   - Should show: `🔨 [FORENSIC] next.config.js loaded from ROOT directory`
   - Should show: `🔨🔨🔨 GENERATING NEW BUILD ID 🔨🔨🔨`

2. **Browser Console (F12):**
   - Should show: `🚨 FORENSIC MARKER: ROOT-DIRECTORY-BUILD-...`
   - Should show: `🚨🚨🚨 DASHBOARD CODE LOADED - VERSION 5.0-DRAFTS-FIX 🚨🚨🚨`

3. **Visual Indicator:**
   - Bottom-left corner should show: `MONOREPO v5.0-DRAFTS-FIX | ROOT-DIR | Build: ...`
   - **"ROOT-DIR" must appear** - this proves root directory code is running

4. **Page Source:**
   - Right-click → "View Page Source"
   - Search for: `ROOT-DIRECTORY-BUILD`
   - **MUST BE FOUND**

---

## Troubleshooting

### Changes Don't Appear After Deployment

1. **Check Root Directory:**
   - Vercel Dashboard → Settings → General
   - Must be empty (not `/frontend`)

2. **Check Repository:**
   - Vercel Dashboard → Settings → Git
   - Must be `Jim-devENG/agent-frontend`

3. **Check Commit Hash:**
   - Local: `git log main --oneline -1`
   - Vercel: Latest deployment → Check commit hash
   - Must match

4. **Force Clean Build:**
   - Add env var: `VERCEL_FORCE_NO_BUILD_CACHE=1`
   - Redeploy

### Build Fails with Schema Error

If you see: `"should NOT have additional property 'rootDirectory'"`

- Remove `rootDirectory` from `vercel.json`
- Root directory must be set in Vercel dashboard only

---

## Emergency Contacts

If deployment issues persist:
1. Check `DEPLOYMENT_SAFEGUARDS.md` for detailed troubleshooting
2. Check `FORENSIC_DEPLOYMENT_DIAGNOSIS.md` for root cause analysis
3. Verify all settings match this document

---

## Quick Reference

**Correct Setup:**
- Root Directory: Empty
- Repository: `Jim-devENG/agent-frontend`
- Branch: `main`
- Remote: `jim-frontend`
- Push: `git push jim-frontend main`

**Never:**
- Set Root Directory to `/frontend`
- Add `rootDirectory` to `vercel.json`
- Push to `origin` remote
- Change repository without updating team


