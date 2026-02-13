# 🔧 Environment Variables Fix

## Issue Fixed
❌ **Error**: `process is not defined` in authService.ts  
✅ **Solution**: Changed from `process.env` to `import.meta.env` for Vite compatibility

## What Changed

### 1. Updated `authService.ts`
- Replaced all `process.env.NEXT_PUBLIC_*` with `import.meta.env.VITE_*`
- Vite requires the `VITE_` prefix for environment variables

### 2. Created `.env.local`
Added Vite-compatible environment variables:
```
VITE_API_URL=http://localhost:5000/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_RAZORPAY_KEY_ID=...
```

## 🚀 **RESTART REQUIRED**

**IMPORTANT**: You need to restart the frontend dev server to pick up the new environment variables!

### Steps:
1. **Stop the frontend server** (Ctrl+C in the terminal running `npm run dev`)
2. **Restart it**: `npm run dev`
3. The error should be gone!

## Environment Variable Rules for Vite

| Backend (Node.js) | Frontend (Vite) |
|------------------|-----------------|
| `process.env.MONGODB_URI` | ❌ Won't work |
| `process.env.NEXT_PUBLIC_*` | ❌ Won't work |
| N/A | ✅ import.meta.env.VITE_* |

## Files Modified
- ✅ `src/services/authService.ts` - Fixed Firebase config
- ✅ `.env.local` - Added Vite environment variables

## Testing
After restarting, try:
1. Click "Buy Now" on any product
2. The login modal should appear (no errors)
3. Sign up or login
4. Should work perfectly!

---

**Note**: The `.env.local` file is NOT committed to git (already in .gitignore), so your credentials are safe.
