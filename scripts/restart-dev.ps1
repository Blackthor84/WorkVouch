# PowerShell script to safely restart WorkVouch dev server

Write-Host "🔄 WorkVouch Dev Server Restart Script" -ForegroundColor Cyan
Write-Host ""

# Kill any Node.js processes using ports 3000 or 3001
$ports = @(3000, 3001)
$killedCount = 0

foreach ($port in $ports) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connections) {
            $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($pid in $pids) {
                try {
                    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Host "⚠️  Killing process $pid ($($process.ProcessName)) on port $port" -ForegroundColor Yellow
                        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                        $killedCount++
                    }
                } catch {
                    Write-Host "   (Process $pid already terminated)" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "✅ Port $port is free" -ForegroundColor Green
        }
    } catch {
        Write-Host "✅ Port $port is free (no connections found)" -ForegroundColor Green
    }
}

if ($killedCount -gt 0) {
    Write-Host ""
    Write-Host "✅ Killed $killedCount process(es)" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    Write-Host "✅ No processes found on ports 3000 or 3001" -ForegroundColor Green
}

Write-Host ""

# Remove Next.js lock files and cache
$lockPaths = @(
    ".next\dev\lock",
    ".next\cache",
    "$env:USERPROFILE\.cursor\.next\dev\lock"
)

$removedCount = 0
foreach ($lockPath in $lockPaths) {
    if (Test-Path $lockPath) {
        try {
            Write-Host "🗑️  Removing: $lockPath" -ForegroundColor Yellow
            Remove-Item $lockPath -Recurse -Force -ErrorAction SilentlyContinue
            $removedCount++
        } catch {
            Write-Host "   (Could not remove $lockPath - may be in use)" -ForegroundColor Gray
        }
    }
}

if ($removedCount -gt 0) {
    Write-Host "✅ Removed $removedCount lock file(s)" -ForegroundColor Green
} else {
    Write-Host "✅ No lock files found" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting Next.js dev server..." -ForegroundColor Cyan
Write-Host ""

# Start Next.js dev server
npm run dev
