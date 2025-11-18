# ============================================================
# IMPORT SUPABASE CSV FILES TO RENDER DATABASE
# Customized for Jose's Setup
# ============================================================

# Configuration
$RENDER_DB_URL = "postgresql://coursefeedback:MGgvOljlqDJMQPm8cyon832dHMkXdTZu@dpg-d4dk4rripnbc73a49ocg-a.singapore-postgres.render.com/coursefeedback"
$CSV_FOLDER = "C:\Users\Jose Iturralde\Downloads"
$PSQL_PATH = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "IMPORTING SUPABASE CSV FILES TO RENDER DATABASE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Map CSV files to tables (in correct order for foreign keys)
$imports = @(
    @{Table="programs"; File="programs_rows.csv"},
    @{Table="users"; File="users_rows.csv"},
    @{Table="students"; File="students_rows.csv"},
    @{Table="secretaries"; File="secretaries_rows.csv"},
    @{Table="department_heads"; File="department_heads_rows.csv"},
    @{Table="instructors"; File="instructors_rows.csv"},
    @{Table="courses"; File="courses_rows.csv"},
    @{Table="class_sections"; File="class_sections_rows.csv"},
    @{Table="enrollments"; File="enrollments_rows.csv"},
    @{Table="evaluation_periods"; File="evaluation_periods_rows.csv"},
    @{Table="evaluations"; File="evaluations_rows.csv"},
    @{Table="system_settings"; File="system_settings_rows.csv"},
    @{Table="audit_logs"; File="audit_logs_rows.csv"},
    @{Table="export_history"; File="export_history_rows.csv"},
    @{Table="password_reset_tokens"; File="password_reset_tokens_rows.csv"},
    @{Table="program_sections"; File="program_sections_rows.csv"}
)

# Import each table
foreach ($import in $imports) {
    $table = $import.Table
    $csv_file = Join-Path $CSV_FOLDER $import.File
    
    if (Test-Path $csv_file) {
        $fileSize = (Get-Item $csv_file).Length
        Write-Host "Importing $table ($fileSize bytes)..." -ForegroundColor Yellow
        
        # Escape the path properly for PostgreSQL
        $escaped_path = $csv_file -replace '\\', '/'
        $copy_command = "\COPY $table FROM '$escaped_path' WITH (FORMAT csv, HEADER true)"
        
        & $PSQL_PATH $RENDER_DB_URL -c $copy_command
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Success: $table imported successfully" -ForegroundColor Green
        } else {
            Write-Host "Failed: $table import failed" -ForegroundColor Red
        }
    } else {
        Write-Host "Skipped: $($import.File) not found" -ForegroundColor Gray
    }
    
    Write-Host ""
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "RESETTING SEQUENCES" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Reset sequences for all tables that have them
$tables_with_sequences = @(
    "programs", "users", "students", "secretaries", "department_heads", 
    "instructors", "courses", "class_sections", "enrollments", 
    "evaluation_periods", "evaluations", "system_settings", 
    "audit_logs", "export_history", "password_reset_tokens", 
    "program_sections"
)

foreach ($table in $tables_with_sequences) {
    $seq = "$table" + "_id_seq"
    $sql = "SELECT setval('$seq', (SELECT COALESCE(MAX(id), 1) FROM $table));"
    
    Write-Host "Resetting sequence for $table..." -ForegroundColor Yellow
    & $PSQL_PATH $RENDER_DB_URL -c $sql 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Success: Sequence reset" -ForegroundColor Green
    }
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
UNION ALL SELECT 'class_sections', COUNT(*) FROM class_sections
UNION ALL SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL SELECT 'evaluations', COUNT(*) FROM evaluations
ORDER BY table_name;
"@

& $PSQL_PATH $RENDER_DB_URL -c $verify_sql

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "IMPORT COMPLETE!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your Render database is now populated with Supabase data!" -ForegroundColor Green
Write-Host "You can now test your deployed backend at:" -ForegroundColor Yellow
Write-Host "https://coursefeedback-backend.onrender.com/docs" -ForegroundColor Cyan
