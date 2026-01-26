# Deployment Verification Guide

## How to Verify Which Code is Running

### Method 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for: `🚨 FORENSIC MARKER: ROOT-DIRECTORY-BUILD-...`
4. **IF FOUND**: Root directory code is running ✅
5. **IF NOT FOUND**: Wrong directory or cached code ❌

### Method 2: Check Page Source
1. Right-click page → "View Page Source"
2. Search for: `ROOT-DIRECTORY-BUILD`
3. **IF FOUND**: Root directory code is deployed ✅
4. **IF NOT FOUND**: Wrong directory or cached code ❌

### Method 3: Check Visual Marker
1. Look at bottom-left corner of page
2. Should show: `MONOREPO v5.0-DRAFTS-FIX | ROOT-DIR | Build: ...`
3. **IF "ROOT-DIR" appears**: Root directory code is running ✅
4. **IF NOT**: Wrong directory or cached code ❌

### Method 4: Check Vercel Settings
1. Vercel Dashboard → Settings → General
2. Check "Root Directory" field
3. **MUST BE:** Empty or `/` (not `/frontend`)
4. If wrong, update and redeploy

### Method 5: Check Repository
1. Vercel Dashboard → Settings → Git
2. Check "Repository" field
3. **MUST BE:** `Jim-devENG/agent-frontend`
4. Check "Production Branch"
5. **MUST BE:** `main`

## If Verification Fails

1. **Root Directory Wrong:**
   - Vercel Dashboard → Settings → General
   - Set "Root Directory" to empty (not `/frontend`)
   - Redeploy

2. **Repository Wrong:**
   - Vercel Dashboard → Settings → Git
   - Disconnect current repo
   - Connect to: `Jim-devENG/agent-frontend`
   - Branch: `main`
   - Redeploy

3. **Build Cache:**
   - Add env var: `VERCEL_FORCE_NO_BUILD_CACHE=1`
   - Redeploy
   - Check build logs for: `🔨🔨🔨 GENERATING NEW BUILD ID 🔨🔨🔨`

