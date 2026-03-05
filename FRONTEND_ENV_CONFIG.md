# Frontend Environment Configuration

## Environment Variables for React App

These environment variables control the frontend behavior across different deployment environments.

### GitHub Pages Production Build

```bash
VITE_BASE_PATH=/ifaapp/          # Base URL path for GitHub Pages
VITE_API_URL=https://api.example.com  # Your backend API endpoint
VITE_DEMO_MODE=true              # Enable demo/fallback data
```

### Local Development

```bash
VITE_BASE_PATH=/                 # Root path for local dev
VITE_API_URL=http://localhost:8080     # Local backend
VITE_DEMO_MODE=true              # Use demo data when API fails
```

### Production Deployment (Custom Domain)

```bash
VITE_BASE_PATH=/                 # Root path (no subfolder)
VITE_API_URL=https://api.ilease.com    # Production API
VITE_DEMO_MODE=false             # Require real API responses
```

---

## Configuration Files

### `.env.example` (Reference)
Shows all available variables but not actual values.

### `.env.local` (Development)
Used only in local development, ignored by git.

### Environment in CI/CD
Set directly in GitHub Actions workflow files.

---

## Using Environment Variables in Code

### 1. Build-time Variables (Vite)
These are baked into the build and cannot be changed at runtime.

```typescript
// frontend/src/config.ts
export const API_URL = import.meta.env.VITE_API_URL
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
export const BASE_PATH = import.meta.env.BASE_URL  // Vite built-in
```

```typescript
// Usage in components
import { API_URL, DEMO_MODE } from '@/config'

if (DEMO_MODE) {
  // Use fallback demo data
  const data = require('@/demo/data.json')
}
```

### 2. Router Base Path

The `<BrowserRouter>` component uses the base path automatically:

```typescript
// frontend/src/main.tsx
import { BrowserRouter } from 'react-router-dom'

// BrowserRouter automatically uses import.meta.env.BASE_URL
const root = ReactDOM.createRoot(...)
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
```

---

## Building for Different Environments

### For GitHub Pages
```bash
VITE_BASE_PATH=/ifaapp/ npm --prefix frontend run build
```

### For Custom Domain
```bash
VITE_BASE_PATH=/ npm --prefix frontend run build
```

### For Local Development
```bash
VITE_BASE_PATH=/ npm --prefix frontend run dev
```

---

## GitHub Actions Workflow Integration

The workflow sets these variables during build:

```yaml
# .github/workflows/deploy-pages.yml
env:
  VITE_APP_TITLE: "Ìlú Àṣẹ"
  VITE_API_URL: "https://api.moyooni.com"
  VITE_DEMO_MODE: "true"
  VITE_BASE_PATH: "/ifaapp/"
```

These are injected at build time and included in the production bundle.

---

## Important Notes

1. **Build-time Only:** These variables are embedded in the build output. They cannot be changed at runtime.

2. **No Secrets:** Never put actual API keys or secrets in these variables. Use environment variables on your backend instead.

3. **Base Path:** The `VITE_BASE_PATH` is critical for GitHub Pages to work correctly. Without it, the app will fail to load assets.

4. **Demo Mode:** When true, the app falls back to demo data if API calls fail. This allows testing without a backend.

5. **API URL:** Should point to your backend API server (or be empty for relative paths).

---

## Known Issues & Solutions

### Assets not loading (404 errors)
**Cause:** Base path set to `/` but deployed to `/ifaapp/`  
**Fix:** Ensure `VITE_BASE_PATH=/ifaapp/` for GitHub Pages

### API calls to wrong URL
**Cause:** API_URL not set correctly  
**Fix:** Verify `VITE_API_URL` in workflow matches your backend

### Demo mode not triggering
**Cause:** `VITE_DEMO_MODE` not set or set to `"false"` string  
**Fix:** Ensure it's set to `"true"` (string, then converted to boolean in code)

---

## Testing Environment Variables

To verify variables are set correctly:

```typescript
// Add to a debug page or console.log
console.log('Base URL:', import.meta.env.BASE_URL)
console.log('API URL:', import.meta.env.VITE_API_URL)
console.log('Demo Mode:', import.meta.env.VITE_DEMO_MODE)
console.log('All env:', import.meta.env)
```

---

## References

- **Vite Environment Variables:** https://vitejs.dev/guide/env-and-modes.html
- **React Router Base Path:** https://reactrouter.com/
- **GitHub Actions:** https://docs.github.com/en/actions

