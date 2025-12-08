# System Data Cleanup Helper
# Provides easy commands to reset and check your system data

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Course Feedback System - Data Cleanup Helper                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

Write-Host "Available Commands:" -ForegroundColor Yellow
Write-Host "  1. Check current data status" -ForegroundColor White
Write-Host "  2. Reset ONLY students & evaluations (RECOMMENDED)" -ForegroundColor Yellow
Write-Host "  3. Reset ALL system data (FULL RESET)" -ForegroundColor Red
Write-Host "  4. Exit`n" -ForegroundColor White

$choice = Read-Host "Select option (1-4)"

switch ($choice) {
    "1" {
        Write-Host "`nChecking current data status...`n" -ForegroundColor Green
        & .venv\Scripts\python.exe Back\App\check_data_status.py
    }
    "2" {
        Write-Host "`n⚠️  This will DELETE students & evaluations only.`n" -ForegroundColor Yellow
        Write-Host "Preserves: Staff, Courses, Programs, Sections`n" -ForegroundColor Green
        $confirm = Read-Host "Continue? Type 'yes'"
        
        if ($confirm -eq "yes") {
            Write-Host "`nStarting student data reset...`n" -ForegroundColor Yellow
            & .venv\Scripts\python.exe Back\App\reset_students_evaluations.py
        } else {
            Write-Host "`nCancelled." -ForegroundColor Gray
        }
    }
    "3" {
        Write-Host "`n⚠️  WARNING: This will DELETE ALL data except admin accounts!`n" -ForegroundColor Red
        $confirm = Read-Host "Are you absolutely sure? Type 'yes' to continue"
        
        if ($confirm -eq "yes") {
            Write-Host "`nStarting full data reset...`n" -ForegroundColor Yellow
            & .venv\Scripts\python.exe Back\App\reset_system_data.py
        } else {
            Write-Host "`nCancelled." -ForegroundColor Gray
        }
    }
    "4" {
        Write-Host "`nExiting...`n" -ForegroundColor Gray
        exit
    }
    default {
        Write-Host "`nInvalid option.`n" -ForegroundColor Red
    }
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
