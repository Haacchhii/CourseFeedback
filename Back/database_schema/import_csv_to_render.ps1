# ============================================================
# IMPORT SUPABASE CSV FILES TO RENDER DATABASE
# PowerShell Script
# ============================================================

# INSTRUCTIONS:
# 1. Update $RENDER_DB_URL with your Render External Database URL
# 2. Update $CSV_FOLDER with the path to your CSV files
# 3. Run this script in PowerShell

# Configuration
$RENDER_DB_URL = "postgresql://coursefeedback:PASSWORD@dpg-xxx.oregon-postgres.render.com/coursefeedback"
$CSV_FOLDER = "C:\Users\Jose Iturralde\Documents\1 thesis\csv_exports"

# Check if psql is available
$PSQL_PATH = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "IMPORTING CSV FILES TO RENDER DATABASE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# List of tables in order (respecting foreign key constraints)
$tables = @(
    "programs",
    "users",
    "students",
    "secretaries",
    "department_heads",
    "instructors",
    "courses",
    "class_sections",
    "enrollments",
    "evaluation_periods",
    "evaluations",
    "system_settings",
    "audit_logs",
    "export_history",
    "scheduled_exports",
    "password_reset_tokens",
    "backup_history",
    "period_enrollments",
    "program_sections"
)

# Import each table
foreach ($table in $tables) {
    $csv_file = Join-Path $CSV_FOLDER "$table.csv"
    
    if (Test-Path $csv_file) {
        Write-Host "Importing $table..." -ForegroundColor Yellow
        
        $copy_command = "\COPY $table FROM '$csv_file' WITH CSV HEADER"
        
        & $PSQL_PATH $RENDER_DB_URL -c $copy_command
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $table imported successfully" -ForegroundColor Green
        } else {
            Write-Host "✗ $table import failed" -ForegroundColor Red
        }
    } else {
        Write-Host "⊘ $table.csv not found, skipping..." -ForegroundColor Gray
    }
    
    Write-Host ""
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "RESETTING SEQUENCES" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Reset sequences
$sequences = @(
    "programs_id_seq",
    "users_id_seq",
    "students_id_seq",
    "secretaries_id_seq",
    "department_heads_id_seq",
    "instructors_id_seq",
    "courses_id_seq",
    "class_sections_id_seq",
    "enrollments_id_seq",
    "evaluation_periods_id_seq",
    "evaluations_id_seq",
    "system_settings_id_seq",
    "audit_logs_id_seq"
)

foreach ($seq in $sequences) {
    $table_name = $seq -replace '_id_seq$', ''
    $sql = "SELECT setval('$seq', (SELECT COALESCE(MAX(id), 1) FROM $table_name));"
    
    Write-Host "Resetting $seq..." -ForegroundColor Yellow
    & $PSQL_PATH $RENDER_DB_URL -c $sql
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "VERIFYING IMPORT" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Verify counts
$verify_sql = @"
SELECT 'programs' as table_name, COUNT(*) as count FROM programs
UNION ALL SELECT 'users', COUNT(*) FROM users
UNION ALL SELECT 'students', COUNT(*) FROM students
UNION ALL SELECT 'courses', COUNT(*) FROM courses
UNION ALL SELECT 'evaluations', COUNT(*) FROM evaluations
UNION ALL SELECT 'class_sections', COUNT(*) FROM class_sections
UNION ALL SELECT 'enrollments', COUNT(*) FROM enrollments;
"@

& $PSQL_PATH $RENDER_DB_URL -c $verify_sql

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "IMPORT COMPLETE!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
