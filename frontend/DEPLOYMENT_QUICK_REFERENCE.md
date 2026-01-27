# Deployment Quick Reference Card

## 🚨 Critical Settings (Never Change)

| Setting | Location | Must Be |
|---------|----------|---------|
| **Root Directory** | Vercel → Settings → General | **Empty** (not `/frontend`) |
| **Repository** | Vercel → Settings → Git | **`Jim-devENG/agent-frontend`** |
| **Production Branch** | Vercel → Settings → Git | **`main`** |

## ✅ Pre-Deployment Checklist

- [ ] Root Directory is empty (Vercel Dashboard)
- [ ] Repository is `Jim-devENG/agent-frontend` (Vercel Dashboard)
- [ ] `vercel.json` does NOT have `rootDirectory` property
- [ ] Pushing to `jim-frontend` remote (not `origin`)
- [ ] On `main` branch

## 🚀 Deployment Command

```bash
git push jim-frontend main
```

## ✅ Post-Deployment Verification

After deployment, check:

1. **Browser Console:** `🚨 FORENSIC MARKER: ROOT-DIRECTORY-BUILD-...`
2. **Visual Marker:** Bottom-left shows `ROOT-DIR`
3. **Build Logs:** Show `🔨 [FORENSIC] next.config.js loaded from ROOT directory`

## 🚨 If Changes Don't Appear

1. Check Root Directory is empty
2. Check Repository is correct
3. Add env var: `VERCEL_FORCE_NO_BUILD_CACHE=1`
4. Redeploy

## 📚 Full Documentation

- [`README_DEPLOYMENT.md`](./README_DEPLOYMENT.md) - Complete deployment guide
- [`DEPLOYMENT_SAFEGUARDS.md`](./DEPLOYMENT_SAFEGUARDS.md) - Prevention measures
- [`FORENSIC_DEPLOYMENT_DIAGNOSIS.md`](./FORENSIC_DEPLOYMENT_DIAGNOSIS.md) - Root cause analysis


