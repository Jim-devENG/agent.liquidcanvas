# Deployment Safeguards - Prevent Future Issues

## 🛡️ Critical Settings That Must Never Change

### 1. Vercel Root Directory
**MUST ALWAYS BE:** Empty (blank) - NOT `/frontend` or anything else

**Why:** The repository root IS the frontend directory. Setting it to `/frontend` would make Vercel look for `frontend/frontend/` which doesn't exist or is stale.

**How to Verify:**
1. Vercel Dashboard → Settings → General
2. Check "Root Directory" field
3. **MUST BE:** Empty/blank
4. If wrong, fix immediately

**Prevention:** Document this in project README and team onboarding.

---

### 2. Vercel Repository Connection
**MUST ALWAYS BE:** `Jim-devENG/agent-frontend`

**Why:** Code is pushed to `jim-frontend` remote. If Vercel watches `origin` (liquidcanvasvideos), it will deploy stale code.

**How to Verify:**
1. Vercel Dashboard → Settings → Git
2. Check "Repository" field
3. **MUST BE:** `Jim-devENG/agent-frontend`
4. Check "Production Branch"
5. **MUST BE:** `main`

**Prevention:** Add this to deployment checklist.

---

### 3. Git Remote Push Target
**ALWAYS PUSH TO:** `jim-frontend` remote

**Why:** This is the repository Vercel watches. Pushing to `origin` won't trigger deployments.

**Command:**
```bash
git push jim-frontend main
```

**Prevention:** Create a git alias or script to ensure correct remote.

---

### 4. vercel.json Restrictions
**NEVER ADD:** `rootDirectory` property

**Why:** Vercel doesn't accept `rootDirectory` in `vercel.json`. It must be set in dashboard only.

**Valid Properties:**
- `buildCommand`
- `outputDirectory`
- `installCommand`
- `framework`
- `ignoreCommand`
- `git`
- `cleanUrls`
- `rewrites`
- `headers`

**Prevention:** Add validation or documentation.

---

## ✅ Pre-Deployment Checklist

Before every deployment, verify:

- [ ] Vercel Root Directory is empty (Settings → General)
- [ ] Vercel Repository is `Jim-devENG/agent-frontend` (Settings → Git)
- [ ] Production Branch is `main` (Settings → Git)
- [ ] Pushing to `jim-frontend` remote (not `origin`)
- [ ] `vercel.json` does NOT have `rootDirectory` property
- [ ] Build logs show forensic markers after deployment
- [ ] Browser console shows `ROOT-DIRECTORY-BUILD` marker
- [ ] Visual marker shows `ROOT-DIR` in bottom-left

---

## 🔍 Automated Verification

### Add to CI/CD or Pre-commit Hook

```bash
#!/bin/bash
# verify-deployment.sh

echo "🔍 Verifying deployment configuration..."

# Check vercel.json doesn't have rootDirectory
if grep -q "rootDirectory" vercel.json; then
  echo "❌ ERROR: vercel.json contains 'rootDirectory' - remove it!"
  exit 1
fi

# Check correct remote exists
if ! git remote get-url jim-frontend | grep -q "Jim-devENG/agent-frontend"; then
  echo "❌ ERROR: jim-frontend remote is incorrect!"
  exit 1
fi

echo "✅ Deployment configuration verified"
```

---

## 📋 Deployment Process (Standardized)

### Step 1: Pre-Deployment Verification
```bash
cd frontend
git status  # Ensure clean working directory
git log --oneline -1  # Note commit hash
```

### Step 2: Push to Correct Remote
```bash
git push jim-frontend main
```

### Step 3: Verify Vercel Settings (Manual Check)
1. Vercel Dashboard → Settings → General → Root Directory (must be empty)
2. Vercel Dashboard → Settings → Git → Repository (must be `Jim-devENG/agent-frontend`)
3. Vercel Dashboard → Settings → Git → Production Branch (must be `main`)

### Step 4: Wait for Deployment
- Monitor Vercel dashboard
- Check build logs for forensic markers
- Wait 2-5 minutes for deployment to complete

### Step 5: Post-Deployment Verification
1. Hard refresh browser: `Ctrl+Shift+R`
2. Check console for: `🚨 FORENSIC MARKER: ROOT-DIRECTORY-BUILD-...`
3. Check bottom-left for: `ROOT-DIR` indicator
4. Verify changes are visible

---

## 🚨 Warning Signs

If you see these, something is wrong:

1. **Build succeeds but changes don't appear**
   - Check Root Directory setting
   - Check Repository connection
   - Check commit hash matches

2. **Build logs don't show forensic markers**
   - Build cache is being used
   - Add `VERCEL_FORCE_NO_BUILD_CACHE=1` env var

3. **Browser console doesn't show `ROOT-DIRECTORY-BUILD`**
   - Wrong code is deployed
   - Check Vercel settings
   - Verify correct repository

4. **Visual marker doesn't show `ROOT-DIR`**
   - Root directory is wrong
   - Fix in Vercel dashboard

---

## 📝 Documentation Requirements

### For New Team Members
1. Read `DEPLOYMENT_SAFEGUARDS.md`
2. Verify Vercel settings match documented values
3. Understand git remote setup (`jim-frontend` vs `origin`)
4. Know how to verify deployment (forensic markers)

### For Code Changes
1. Always test locally first
2. Push to `jim-frontend` remote
3. Verify deployment after push
4. Check forensic markers in production

---

## 🔧 Maintenance Tasks

### Monthly
- [ ] Verify Vercel Root Directory is still empty
- [ ] Verify Vercel Repository is still correct
- [ ] Check for any new Vercel settings that might affect deployment
- [ ] Review build logs for any warnings

### After Vercel Updates
- [ ] Re-verify all settings
- [ ] Test deployment process
- [ ] Update documentation if needed

---

## 🎯 Quick Reference

**Correct Setup:**
- Root Directory: Empty
- Repository: `Jim-devENG/agent-frontend`
- Branch: `main`
- Remote: `jim-frontend`
- Push Command: `git push jim-frontend main`

**Never:**
- Set Root Directory to `/frontend`
- Add `rootDirectory` to `vercel.json`
- Push to `origin` remote (unless Vercel is reconfigured)
- Change repository connection without updating team


