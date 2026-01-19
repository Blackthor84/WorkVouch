# How to Start the App

## Quick Start Commands

### Step 1: Navigate to Project Directory
```bash
cd C:\Users\ajaye\.cursor
```

### Step 2: Start Development Server
```bash
npm run dev
```

## Complete Process

1. **Open Terminal/PowerShell**
   - Press `Win + R`
   - Type `powershell` or `cmd`
   - Press Enter

2. **Navigate to Project**
   ```bash
   cd C:\Users\ajaye\.cursor
   ```

3. **Start Server**
   ```bash
   npm run dev
   ```

4. **Wait for Compilation**
   - Look for: "Compiled successfully"
   - You'll see: "Local: http://localhost:3000"

5. **Open Browser**
   - Go to: http://localhost:3000

## To Stop the Server
- Press `Ctrl + C` in the terminal

## Troubleshooting

**"npm is not recognized"**
- Install Node.js from https://nodejs.org/
- Restart terminal after installation

**"Port 3000 already in use"**
- Use different port: `npm run dev -- -p 3001`
- Or stop other process using port 3000

**Server won't start**
- Make sure you're in the correct directory
- Check that `package.json` exists
- Run `npm install` first if needed
