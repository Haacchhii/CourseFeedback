# Defense Day Quick Start Script
# Run this before your thesis defense to ensure everything is ready

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   THESIS DEFENSE - PRE-CHECK SCRIPT" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Course Feedback System - Readiness Check" -ForegroundColor White
Write-Host ""

$baseDir = "c:\Users\Jose Iturralde\Documents\1 thesis"
$backendDir = "$baseDir\Back\App"
$frontendDir = "$baseDir\New\capstone"

# Step 1: Check Backend
Write-Host "[1/6] Checking Backend..." -ForegroundColor Yellow
Set-Location $backendDir

$backendTest = & python -c "from main import app; print('OK')" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK Backend: OK" -ForegroundColor Green
} else {
    Write-Host "  X Backend: ERROR" -ForegroundColor Red
    Write-Host "  Issue: Backend failed to load" -ForegroundColor Red
    exit 1
}

# Step 2: Check Database Connection
Write-Host ""
Write-Host "[2/6] Testing Database Connection..." -ForegroundColor Yellow
$dbTest = & python -c "from database.connection import test_connection; print('OK' if test_connection() else 'FAIL')" 2>&1
if ($dbTest -match "OK") {
    Write-Host "  OK Database: CONNECTED" -ForegroundColor Green
} else {
    Write-Host "  X Database: CONNECTION FAILED" -ForegroundColor Red
    Write-Host "  Issue: Make sure PostgreSQL is running" -ForegroundColor Red
    exit 1
}

# Step 3: Check Frontend Dependencies
Write-Host ""
Write-Host "[3/6] Checking Frontend..." -ForegroundColor Yellow
Set-Location $frontendDir

if (Test-Path "node_modules") {
    Write-Host "  OK Frontend: Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  ! Frontend: Installing dependencies..." -ForegroundColor Yellow
    npm install | Out-Null
    Write-Host "  OK Frontend: Dependencies installed" -ForegroundColor Green
}

# Step 4: Check Logs Directory
Write-Host ""
Write-Host "[4/6] Checking Logs Directory..." -ForegroundColor Yellow
$logsDir = "$backendDir\logs"
if (Test-Path $logsDir) {
    Write-Host "  OK Logs: Directory exists" -ForegroundColor Green
} else {
    New-Item -ItemType Directory -Path $logsDir | Out-Null
    Write-Host "  OK Logs: Directory created" -ForegroundColor Green
}

# Step 5: Check Recent Errors
Write-Host ""
Write-Host "[5/6] Checking for Recent Errors..." -ForegroundColor Yellow
$logFile = "$logsDir\app.log"
if (Test-Path $logFile) {
    $recentErrors = Get-Content $logFile -Tail 50 | Select-String "ERROR"
    if ($recentErrors.Count -gt 0) {
        Write-Host "  ! Found $($recentErrors.Count) recent errors in logs" -ForegroundColor Yellow
        Write-Host "    Review logs before defense: $logFile" -ForegroundColor Yellow
    } else {
        Write-Host "  OK No recent errors in logs" -ForegroundColor Green
    }
} else {
    Write-Host "  i No log file yet (will be created on first run)" -ForegroundColor Cyan
}

# Step 6: Port Availability
Write-Host ""
Write-Host "[6/6] Checking Port Availability..." -ForegroundColor Yellow

$port8000 = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
if ($port8000) {
    Write-Host "  ! Port 8000: IN USE (backend may already be running)" -ForegroundColor Yellow
} else {
    Write-Host "  OK Port 8000: AVAILABLE" -ForegroundColor Green
}

$port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($port5173) {
    Write-Host "  ! Port 5173: IN USE (frontend may already be running)" -ForegroundColor Yellow
} else {
    Write-Host "  OK Port 5173: AVAILABLE" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   SYSTEM STATUS: READY" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "TO START YOUR SYSTEM:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Backend:" -ForegroundColor White
Write-Host "   cd '$backendDir'" -ForegroundColor Gray
Write-Host "   python main.py" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Frontend (in new terminal):" -ForegroundColor White
Write-Host "   cd '$frontendDir'" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Access System:" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "   Health Check: http://localhost:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "QUICK TESTS:" -ForegroundColor Yellow
Write-Host "   - Login as admin (should work)" -ForegroundColor White
Write-Host "   - Check health endpoint (should show green)" -ForegroundColor White
Write-Host "   - Open browser console (should have no errors)" -ForegroundColor White
Write-Host "   - Submit a test evaluation (should succeed)" -ForegroundColor White
Write-Host ""
Write-Host "LOGS LOCATION:" -ForegroundColor Yellow
Write-Host "   $logFile" -ForegroundColor Gray
Write-Host ""
Write-Host "Good luck with your defense!" -ForegroundColor Green
Write-Host "==========================================`n" -ForegroundColor Cyan
