# Fix Blank Page - Clear Build Cache

## If using Command Prompt (cmd):

```cmd
cd C:\Users\ajaye\.cursor
rmdir /s /q .next
npm run dev
```

## If using PowerShell:

```powershell
cd C:\Users\ajaye\.cursor
Remove-Item -Recurse -Force .next
npm run dev
```

## Manual Method (Easiest):

1. **Stop the server** (Press `Ctrl+C` in terminal)

2. **Delete the `.next` folder:**
   - Open File Explorer
   - Navigate to `C:\Users\ajaye\.cursor`
   - Find the `.next` folder
   - Delete it (or right-click → Delete)

3. **Restart the server:**
   ```cmd
   cd C:\Users\ajaye\.cursor
   npm run dev
   ```

4. **Wait for compilation** (30-60 seconds)

5. **Refresh browser** with `Ctrl+Shift+R`
