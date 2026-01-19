# Fix PowerShell Execution Policy Issue

## Problem
PowerShell is blocking npm scripts due to execution policy restrictions.

## Solution Options

### Option 1: Change Execution Policy (Recommended)

Run this command in PowerShell (as Administrator):

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try:
```bash
npm run dev
```

### Option 2: Bypass for Single Command

Run npm with bypass:
```powershell
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```

### Option 3: Use Command Prompt Instead

1. Press `Win + R`
2. Type `cmd` and press Enter
3. Navigate to project:
   ```cmd
   cd C:\Users\ajaye\.cursor
   ```
4. Run:
   ```cmd
   npm run dev
   ```

### Option 4: Use Git Bash or WSL

If you have Git Bash or WSL installed, use those terminals instead.
