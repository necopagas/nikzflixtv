# Vercel Deployment Checklist

## ✅ Issues Fixed:

### 1. Created `vercel.json` configuration

- ✅ Set build command
- ✅ Set output directory to `dist`
- ✅ Added SPA routing (redirects to index.html)
- ✅ Added cache headers for assets

### 2. Common Vercel Issues & Solutions:

#### **Issue: Blank Page / White Screen**

**Causes:**

1. Missing environment variables
2. Console errors
3. Base path issues
4. API endpoints not working

**Solutions:**

#### A. Add Environment Variables in Vercel

Go to: Project Settings → Environment Variables

Add these:

```
VITE_TMDB_API_KEY = your_key
VITE_SENTRY_DSN = your_sentry_dsn (optional)
```

#### B. Check Browser Console

Open deployed site → F12 → Console tab
Look for errors like:

- `Failed to fetch`
- `404 errors`
- `CORS errors`

#### C. Fix Base Path (if deployed to subdirectory)

If deploying to subdirectory, update `vite.config.js`:

```javascript
export default defineConfig({
  base: '/your-subdirectory/', // or just '/' for root
});
```

#### D. Fix Service Worker Path

Update `src/main.jsx` line ~27:

```javascript
// Change from
navigator.serviceWorker.register('/sw.js');

// To (if needed)
navigator.serviceWorker.register('/sw.js', { scope: '/' });
```

---

## 🚀 Deploy Steps:

### Method 1: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Method 2: Vercel Dashboard

1. Go to vercel.com/new
2. Import from GitHub: necopagas/nikzflixtv
3. Configure:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add Environment Variables
5. Click Deploy

---

## 🔍 Debug Deployed Site:

### 1. Check Build Logs

Vercel Dashboard → Deployments → Click latest → View Build Logs

Look for:

- ✅ "Build Completed"
- ❌ Any error messages
- ⚠️ Warnings about missing env vars

### 2. Check Function Logs (if using serverless)

Vercel Dashboard → Functions → View Logs

### 3. Check Network Tab

F12 → Network → Refresh page
Look for:

- Failed requests (red)
- 404 errors
- CORS issues

### 4. Check Console Errors

F12 → Console
Common errors:

```
❌ Uncaught ReferenceError: process is not defined
   Fix: Use import.meta.env instead of process.env

❌ Failed to load module script
   Fix: Check base path in vite.config.js

❌ Failed to register service worker
   Fix: Service worker only works on HTTPS
```

---

## 🐛 Common Fixes:

### Fix 1: Blank Page (No Console Errors)

```javascript
// Add to src/main.jsx at the very top
console.log('🚀 App Starting...', import.meta.env.MODE);
```

### Fix 2: Environment Variables Not Working

```javascript
// Check if they're loaded
console.log('Env loaded:', {
  mode: import.meta.env.MODE,
  hasApiKey: !!import.meta.env.VITE_TMDB_API_KEY,
});
```

### Fix 3: Service Worker Causing Issues

Temporarily disable in `src/main.jsx`:

```javascript
// Comment out service worker registration
/*
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  ...
}
*/
```

### Fix 4: Husky Pre-commit Hook Failing in Vercel

Add to `package.json`:

```json
{
  "scripts": {
    "vercel-build": "npm run build"
  }
}
```

Or update Vercel build command to:

```bash
npm run build --ignore-scripts
```

---

## ✅ Verification Steps:

After deployment:

1. ✅ Visit deployed URL
2. ✅ Check homepage loads
3. ✅ Test navigation (click different pages)
4. ✅ Check network tab for failed requests
5. ✅ Test on mobile
6. ✅ Test in incognito (no cache)

---

## 📝 Quick Commands:

```bash
# Local preview of production build
npm run build
npm run preview

# Deploy to Vercel
vercel --prod

# Check build locally
npm run build 2>&1 | tee build.log
```

---

## 🆘 Still Not Working?

Share with me:

1. Deployed URL
2. Browser console errors (F12 → Console)
3. Network tab errors (F12 → Network)
4. Vercel build logs

And I'll help fix it! 🔧
