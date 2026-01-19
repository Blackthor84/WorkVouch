# Fix Route Conflict Error

## The Error

```
Error: You cannot use different slug names for the same dynamic path ('id' !== 'userId').
```

## The Problem

Next.js detected conflicting dynamic route segments. This usually happens when:
1. You have both `[id]` and `[userId]` routes at the same level
2. A deleted route is still in the build cache
3. There's a file system issue

## ✅ Solution

### Step 1: Clear Build Cache

```powershell
Remove-Item -Recurse -Force .next
```

### Step 2: Restart Dev Server

1. Stop the dev server (Ctrl+C)
2. Start it again:
   ```powershell
   npm run dev
   ```

### Step 3: Verify Routes

Make sure you don't have both:
- `app/employer/profile/[id]/page.tsx` ✅
- `app/employer/profile/[userId]/page.tsx` ❌ (should NOT exist)

## Current Routes (Should be)

- ✅ `app/employer/candidates/[id]/page.tsx`
- ✅ `app/employer/profile/[id]/page.tsx`
- ✅ `app/employer/reports/[candidateId]/page.tsx`
- ✅ `app/jobs/[jobId]/coworkers/page.tsx`

All use different parameter names, so there should be no conflict.

## If Error Persists

1. Check if there's a `[userId]` directory anywhere:
   ```powershell
   Get-ChildItem -Path "app" -Recurse -Directory | Where-Object { $_.Name -eq '[userId]' }
   ```

2. If found, delete it:
   ```powershell
   Remove-Item -Recurse -Force "app\employer\profile\[userId]"
   ```

3. Clear cache and restart again

---

**The build cache has been cleared. Restart your dev server now!**
