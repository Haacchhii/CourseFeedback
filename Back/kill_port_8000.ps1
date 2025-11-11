# Script to kill all processes using port 8000
Write-Host "🔍 Checking for processes on port 8000..." -ForegroundColor Cyan

$connections = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue

if ($connections) {
    $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    
    Write-Host "Found $($pids.Count) process(es) using port 8000:" -ForegroundColor Yellow
    
    foreach ($pid in $pids) {
        try {
            $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
            if ($process) {
                Write-Host "  PID $pid - $($process.Name)" -ForegroundColor White
                Stop-Process -Id $pid -Force
                Write-Host "  ✅ Killed PID $pid" -ForegroundColor Green
            }
        } catch {
            Write-Host "  ⚠️ Could not kill PID $pid (may already be stopped)" -ForegroundColor Yellow
        }
    }
    
    Write-Host "`n✅ Port 8000 is now free!" -ForegroundColor Green
} else {
    Write-Host "✅ No processes found on port 8000" -ForegroundColor Green
}
