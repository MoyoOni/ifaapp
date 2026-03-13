# GitHub Pages Deployment Guide

**Status:** ✅ Workflow Created  
**Location:** `.github/workflows/deploy-pages.yml`  
**Deploy URL:** `https://moyooni.github.io/ifaapp/`

---

## 🚀 Quick Setup

### Step 1: Enable GitHub Pages in Repository Settings

1. Go to your GitHub repository: `https://github.com/MoyoOni/ifaapp`
2. Click **Settings** (top navigation)
3. Scroll down to **"Code and automation" → "Pages"**
4. Under **"Build and deployment"**:
   - **Source:** Select "GitHub Actions"
   - This allows the workflow file to deploy automatically

**OR** (if you prefer branch-based deployment):
- **Source:** Select "Deploy from a branch"
- **Branch:** Select `ifaapp`
- **Folder:** Select `/ (root)`

### Step 2: Confirm Workflow Settings

✅ The workflow file is already created at `.github/workflows/deploy-pages.yml`

It will:
1. **Trigger on push** to the `ifaapp` branch
2. **Install dependencies** with `npm install`
3. **Build frontend** with `npm --prefix frontend run build`
4. **Deploy to GitHub Pages** automatically
5. **Available at:** `https://moyooni.github.io/ifaapp/`

### Step 3: Test the Deployment

Push a commit to your `ifaapp` branch:

```bash
git add .github/workflows/deploy-pages.yml frontend/vite.config.ts
git commit -m "ci: add GitHub Actions workflow for GitHub Pages deployment"
git push origin ifaapp
```

Then visit: **`https://moyooni.github.io/ifaapp/`**

---

## 📋 What the Workflow Does

```yaml
┌─────────────────────────────────────────────────────┐
│  1. Triggered on push to 'ifaapp' branch            │
│  2. Checks out your code                            │
│  3. Installs Node.js 20 + npm dependencies          │
│  4. Builds frontend: npm --prefix frontend run build│
│  5. Uploads dist/ folder to GitHub Pages            │
│  6. Deploys automatically                           │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Configuration Options

### Base Path
The frontend is configured to use `/ifaapp/` as the base path for GitHub Pages URLs.

To change this (e.g., for a custom domain):
1. Update `.env.example`:
```bash
VITE_BASE_PATH=/  # For custom domains
VITE_BASE_PATH=/ifaapp/  # For GitHub Pages (default)
```

2. Update the workflow to match your needs

### API Endpoint
Update the API URL in `.github/workflows/deploy-pages.yml`:
```yaml
VITE_API_URL: "https://api.moyooni.com"  # ← Change this
```

### Demo Mode
Demo mode is enabled by default for GitHub Pages:
```yaml
VITE_DEMO_MODE: "true"  # Allows app to work without backend
```

---

## ✅ Deployment Checklist

- [ ] Repository settings updated (GitHub Actions selected as source)
- [ ] `.github/workflows/deploy-pages.yml` created ✅
- [ ] `frontend/vite.config.ts` updated with base path ✅
- [ ] Changes pushed to `ifaapp` branch
- [ ] Workflow runs (check Actions tab on GitHub)
- [ ] App appears at `https://moyooni.github.io/ifaapp/`

---

## 🐛 Troubleshooting

### "Workflow fails to build"
- **Check:** Actions tab in GitHub for error messages
- **Fix:** Ensure all dependencies install with `npm install --legacy-peer-deps`

### "Page shows 404 or blank"
- **Check:** Ensure base path is `/ifaapp/` in vite.config.ts
- **Fix:** Verify the build outputs to `frontend/dist/`

### "Demo mode not working"
- **Check:** Verify `VITE_DEMO_MODE: "true"` in workflow
- **Fix:** App should work without backend API

### "Assets not loading (CSS/JS broken)"
- **Likely cause:** Base path mismatch
- **Fix:** Ensure `base: '/ifaapp/'` in vite.config.ts when deploying

---

## 📱 Local Development

For local development (without GitHub Pages base path):

```bash
# Set local environment
export VITE_BASE_PATH=/

# Start dev servers
node start-all-servers.js
```

Or use the environment variable:
```bash
$env:VITE_BASE_PATH="/"; node start-all-servers.js
```

---

## 🔐 Environment Variables

The workflow uses these environment variables (update as needed):

```yaml
VITE_APP_TITLE: "Ìlú Àṣẹ - Digital Nexus"
VITE_API_URL: "https://api.moyooni.com"         # Update to your API
VITE_DEMO_MODE: "true"                          # Keep for GitHub Pages
VITE_BASE_PATH: "/ifaapp/"                      # For GitHub Pages
NODE_VERSION: "20"
```

---

## 📊 What Gets Deployed

The workflow deploys the **frontend build output only**:

```
frontend/dist/ ──→ GitHub Pages ──→ https://moyooni.github.io/ifaapp/
├── index.html        (Entry point)
├── assets/           (CSS, JS, images)
├── logo.svg         (Assets)
└── ...              (All built files)
```

**Note:** Only the frontend is deployed to GitHub Pages. The backend remains at `http://localhost:8080` (or your API server).

---

## 🎯 Next Steps

1. ✅ Workflow file created
2. ✅ Frontend configured with base path
3. 📋 Push changes to test deployment
4. 🔍 Check GitHub Actions tab for build progress
5. 🌐 Visit `https://moyooni.github.io/ifaapp/` to verify

---

## 📞 Support

| Issue | Solution |
|-------|----------|
| Workflow not triggering | Check Settings > Pages, select "GitHub Actions" |
| Build fails | Check Actions tab for error logs |
| Page not loading | Verify base path is `/ifaapp/` |
| Assets broken | Check browser DevTools for 404 errors on assets |
| Custom domain | Update VITE_BASE_PATH and workflow settings |

---

**Created:** March 5, 2026  
**Updated:** Deployment workflow files  
**Status:** ✅ Ready to deploy - Push to trigger first build

