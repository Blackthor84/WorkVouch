# Quick Commands - Always Run These

## ⚠️ IMPORTANT: Always navigate to project folder first!

### Step 1: Navigate to Project
```bash
cd C:\Users\ajaye\.cursor
```

### Step 2: Then run your command
```bash
npm run dev
```

---

## Complete Command Sequence

**Copy and paste this entire block:**

```bash
cd C:\Users\ajaye\.cursor
npm run dev
```

---

## Alternative: Create a Shortcut

You can create a batch file to do this automatically:

1. Create a file named `start.bat` in `C:\Users\ajaye\.cursor`
2. Add this content:
```batch
@echo off
cd /d C:\Users\ajaye\.cursor
npm run dev
```

3. Double-click `start.bat` to start the server

---

## Common Mistake

❌ **Wrong:** Running `npm run dev` from `C:\Users\ajaye`  
✅ **Correct:** Run `cd C:\Users\ajaye\.cursor` first, then `npm run dev`
