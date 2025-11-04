# Database Schema Organization

This folder contains all SQL schema files for the Course Evaluation System, organized by functionality.

## 📋 File Structure

### Core Tables
1. **`01_core_tables.sql`** - Base tables (users, students, courses, class_sections, enrollments, evaluations)
2. **`02_ml_analytics_tables.sql`** - ML processing tables (analysis_results, firebase_sync_log, notification_queue)

### Admin Features
3. **`03_admin_tables.sql`** - Admin-specific tables (evaluation_periods, system_settings, audit_logs, export_history)
4. **`04_secretary_system.sql`** - Secretary role tables and functions (departments, secretary_users)

### Database Objects
5. **`05_views.sql`** - Database views for analytics and reporting
6. **`06_functions.sql`** - Stored procedures and functions
7. **`07_triggers.sql`** - Database triggers for automation
8. **`08_indexes.sql`** - Performance indexes

### Setup
9. **`09_sample_data.sql`** - Sample data for testing
10. **`00_run_all.sql`** - Master script to run all schemas in order

## 🚀 How to Use

### Option 1: Run Everything at Once
```sql
-- In Supabase SQL Editor or psql
\i 00_run_all.sql
```

### Option 2: Run Individual Files
Run files in numerical order (01, 02, 03, etc.)

### Option 3: Selective Setup
- For basic setup: Run 01, 08
- For ML features: Run 01, 02, 05, 06, 07, 08
- For admin features: Run 01, 03, 05, 06, 08
- For full system: Run 00_run_all.sql

## 📦 What Each File Contains

| File | Purpose | Tables/Objects |
|------|---------|----------------|
| 01_core_tables.sql | Base database structure | users, students, courses, class_sections, enrollments, evaluations, programs |
| 02_ml_analytics_tables.sql | Machine learning & analytics | analysis_results, firebase_sync_log, notification_queue |
| 03_admin_tables.sql | System administration | evaluation_periods, system_settings, audit_logs, export_history |
| 04_secretary_system.sql | Secretary role management | departments, secretary_users |
| 05_views.sql | Reporting views | evaluation_analytics, department_overview, audit_log_summary, etc. |
| 06_functions.sql | Helper functions | get_setting(), log_audit_event(), create_secretary_user(), etc. |
| 07_triggers.sql | Automated actions | Firebase sync triggers, timestamp updates |
| 08_indexes.sql | Query optimization | All performance indexes |
| 09_sample_data.sql | Test data | Sample users, courses, departments, settings |
| 00_run_all.sql | Master script | Runs all files in correct order |

## ⚠️ Important Notes

1. **Run in Order**: Files are numbered to show dependency order
2. **Existing Tables**: Core tables use `ALTER TABLE IF NOT EXISTS` to safely add columns
3. **Idempotent**: All scripts are safe to run multiple times
4. **Supabase Compatible**: All scripts tested for Supabase PostgreSQL

## 🔧 Troubleshooting

- **"relation does not exist"**: Run core tables (01) first
- **"column already exists"**: Safe to ignore with `IF NOT EXISTS` clause
- **Permission errors**: Ensure you have database owner/admin privileges
- **Foreign key errors**: Check that referenced tables exist

## 📝 Version History

- **v1.0** (Oct 2024) - Initial schema with ML features
- **v1.1** (Oct 2024) - Added admin features (periods, settings, audit logs)
- **v1.2** (Oct 2024) - Added secretary system
