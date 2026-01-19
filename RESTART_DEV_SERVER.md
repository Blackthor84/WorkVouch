# Fix: Restart Dev Server

## The Problem

Next.js is showing a build error about server/client component boundaries. This is likely a stale build cache issue.

## ✅ Solution

1. **Stop the dev server** (Ctrl+C in the terminal where `npm run dev` is running)

2. **Clear the build cache** (already done):
   ```powershell
   Remove-Item -Recurse -Force .next
   ```

3. **Restart the dev server**:
   ```powershell
   npm run dev
   ```

4. **Wait for compilation** - The error should be gone now.

## Why This Happens

Next.js caches component boundaries. When you change a component from client to server (or vice versa), the cache needs to be cleared and the server restarted.

## Verification

After restarting, the `/superadmin/roles` page should:
- ✅ Compile without errors
- ✅ Load as a server component
- ✅ Render the `RoleManager` client component correctly

---

**Restart your dev server now!**
