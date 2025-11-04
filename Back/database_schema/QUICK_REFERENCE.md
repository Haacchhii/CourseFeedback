# 🗄️ Database Schema Quick Reference Guide

## 📊 Visual Database Structure

```
Course Evaluation System Database
│
├── 👥 USER MANAGEMENT
│   ├── users                    (All system users)
│   ├── students                 (Extended student info)
│   ├── departments              (Department organization)
│   └── secretary_users          (Secretary permissions)
│
├── 📚 COURSE MANAGEMENT
│   ├── programs                 (Academic programs)
│   ├── courses                  (Course catalog)
│   ├── class_sections           (Specific class instances)
│   └── enrollments              (Student enrollments)
│
├── ⭐ EVALUATION SYSTEM
│   ├── evaluations              (Student feedback)
│   ├── evaluation_periods       (Evaluation windows)
│   └── analysis_results         (ML analysis results)
│
├── 🔧 ADMIN FEATURES
│   ├── system_settings          (App configuration)
│   ├── audit_logs               (Security audit trail)
│   └── export_history           (Data export tracking)
│
└── 🔔 NOTIFICATIONS & SYNC
    ├── notification_queue       (Push notifications)
    └── firebase_sync_log        (Real-time sync tracking)
```

## 🎯 What to Run Based on Your Needs

### Scenario 1: Fresh Database Setup (Supabase)
```
Run in this order:
1. 01_core_tables.sql           ← Base structure
2. 02_ml_analytics_tables.sql   ← ML features
3. 03_admin_tables.sql          ← Admin features
4. 04_secretary_system.sql      ← Secretary role
5. 05_views.sql                 ← Reporting views
6. 06_functions.sql             ← Helper functions
7. 07_triggers.sql              ← Automation
8. 08_indexes.sql               ← Performance
9. 09_sample_data.sql           ← Test data (optional)

OR just run: 00_run_all.sql (includes everything)
```

### Scenario 2: Existing Database Migration
```
If you already have users, courses, evaluations tables:
1. Skip 01_core_tables.sql (or review ALTERs only)
2. Run 02-09 as normal
```

### Scenario 3: Minimal Setup (No ML/Admin)
```
1. 01_core_tables.sql
2. 08_indexes.sql
Done! (Basic evaluation system)
```

### Scenario 4: Add Admin Features to Existing System
```
1. 03_admin_tables.sql
2. 05_views.sql (audit_log_summary, settings_by_category)
3. 06_functions.sql (get_setting, update_setting, log_audit_event)
4. 08_indexes.sql (audit and settings indexes)
```

## 📁 File Summary Table

| File | Size | Tables | Views | Functions | Purpose |
|------|------|--------|-------|-----------|---------|
| 01_core_tables.sql | ~3KB | 0 new<br>5 ALTER | 0 | 0 | Enhance existing tables |
| 02_ml_analytics_tables.sql | ~2KB | 3 | 0 | 0 | ML processing infrastructure |
| 03_admin_tables.sql | ~8KB | 4 | 0 | 0 | Admin features + 30 settings |
| 04_secretary_system.sql | ~2KB | 2 | 0 | 0 | Department management |
| 05_views.sql | ~4KB | 0 | 7 | 0 | Pre-built analytics queries |
| 06_functions.sql | ~5KB | 0 | 0 | 7 | Business logic helpers |
| 07_triggers.sql | ~2KB | 0 | 0 | 3 (triggers) | Automation |
| 08_indexes.sql | ~3KB | 0 | 0 | 0 | 40+ performance indexes |
| 09_sample_data.sql | ~4KB | 0 | 0 | 0 | Test data (optional) |
| **00_run_all.sql** | **~2KB** | **-** | **-** | **-** | **Master script** |

## 🔑 Key Relationships

```
users (admin/instructor/student/dept_head/secretary)
  │
  ├─→ students (extended student info)
  ├─→ class_sections (instructor_id)
  ├─→ secretary_users (department access)
  └─→ audit_logs (who did what)

class_sections
  ├─→ courses
  ├─→ evaluations (student feedback)
  └─→ analysis_results (ML processing)

evaluations
  ├─→ students (who submitted)
  ├─→ class_sections (which class)
  └─→ firebase_sync_log (real-time sync)

departments
  ├─→ users (by department)
  ├─→ students (by department)
  └─→ secretary_users (department secretaries)
```

## 🛠️ Common Operations

### Get Active Evaluation Period
```sql
SELECT * FROM get_active_evaluation_period();
```

### Get System Setting
```sql
SELECT get_setting('general', 'site_name');
```

### Log Admin Action
```sql
SELECT log_audit_event(
    user_id, 
    'update', 
    'settings', 
    NULL, 
    '{"setting": "site_name", "new_value": "New Name"}'::jsonb,
    '192.168.1.1'
);
```

### View Evaluation Analytics
```sql
SELECT * FROM evaluation_analytics 
WHERE semester = '1st' 
AND academic_year = '2024-2025';
```

### Check Secretary Access
```sql
SELECT check_secretary_access(secretary_user_id, 'evaluations', department_id);
```

## 📊 Important Views for Your Frontend

### For Admin Dashboard
- `evaluation_analytics` - Course performance metrics
- `audit_log_summary` - Security monitoring
- `settings_by_category` - System configuration overview
- `export_statistics` - Export usage metrics

### For Department Head Dashboard
- `department_overview` - Program-level statistics
- `evaluation_analytics` - Course-level details

### For Secretary Dashboard
- `secretary_dashboard_stats` - Department metrics
- `secretary_department_overview` - Access summary

## ⚡ Performance Tips

1. **All indexes are pre-created** in `08_indexes.sql`
2. **Views are optimized** for common queries
3. **JSONB fields** use GIN indexes where needed
4. **Partitioning** not yet implemented (add if tables grow >1M rows)

## 🚨 Important Notes

### Before Running
- ✅ Backup existing database if not fresh
- ✅ Review ALTER statements in 01_core_tables.sql
- ✅ Comment out 09_sample_data.sql for production
- ✅ Update passwords in sample data if keeping

### After Running
- ✅ Update `DATABASE_URL` in your backend `.env`
- ✅ Test connection: `python Back/App/main.py`
- ✅ Verify routes registered in logs
- ✅ Check Supabase dashboard → Table Editor

### Security Checklist
- ✅ Change sample user passwords
- ✅ Set proper RLS (Row Level Security) policies in Supabase
- ✅ Restrict API key usage
- ✅ Enable audit logging (`security.enable_audit_logs = true`)

## 🔄 Update Existing Schema

If you already ran `enhanced_database_schema.sql`:
```sql
-- Check what you have
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- If missing admin tables, run:
\i 03_admin_tables.sql

-- If missing secretary system, run:
\i 04_secretary_system.sql

-- Always safe to re-run (uses IF NOT EXISTS):
\i 05_views.sql
\i 06_functions.sql
\i 08_indexes.sql
```

## 📞 Troubleshooting

| Error | Solution |
|-------|----------|
| "relation does not exist" | Run 01_core_tables.sql first |
| "column already exists" | Safe to ignore with IF NOT EXISTS |
| "foreign key violation" | Check referenced table exists |
| "permission denied" | Ensure you have database owner rights |
| "function already exists" | Run `DROP FUNCTION` first or use `CREATE OR REPLACE` |

## 📝 Version Control

Track which files you've run:
```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- After running each file:
INSERT INTO schema_migrations (filename) VALUES ('01_core_tables.sql');
```

## 🎓 Learn More

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Supabase SQL Editor: https://supabase.com/docs/guides/database
- SQLAlchemy Models: `Back/App/models/enhanced_models.py`
- API Documentation: `Back/App/API_DOCUMENTATION.md`
