"""
AUTHENTICATION IMPLEMENTATION GUIDE
===================================

This file documents how to add authentication to all API routes.
Run the Python script below to apply authentication automatically.

MANUAL STEPS:
1. Add import to each route file:
   from middleware.auth import get_current_user, require_admin, require_staff, require_student

2. Add authentication parameter to each endpoint:
   
   For ADMIN-ONLY endpoints (user management, evaluation periods, etc.):
   async def endpoint_name(..., current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
   
   For STAFF endpoints (admin, secretary, dept_head):
   async def endpoint_name(..., current_user: dict = Depends(require_staff), db: Session = Depends(get_db)):
   
   For STUDENT endpoints:
   async def endpoint_name(..., current_user: dict = Depends(require_student), db: Session = Depends(get_db)):
   
   For ANY AUTHENTICATED USER:
   async def endpoint_name(..., current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):

3. For student endpoints that access their own data, verify ownership:
   if current_user['role'] == 'student' and current_user['id'] != student_id:
       raise HTTPException(status_code=403, detail="Access denied")

AUTOMATED SCRIPT BELOW:
Run this to add authentication imports to all route files.
"""

import os
import re
from pathlib import Path

# Route files and their required authentication levels
ROUTE_CONFIGS = {
    "system_admin.py": {
        "import": "from middleware.auth import require_admin, require_staff",
        "endpoints": {
            # User Management - Admin only
            "get_all_users": "require_admin",
            "create_user": "require_admin",
            "update_user": "require_admin",
            "delete_user": "require_admin",
            "reset_user_password": "require_admin",
            "get_user_stats": "require_staff",
            
            # Evaluation Periods - Admin creates, Staff can view
            "get_evaluation_periods": "require_staff",
            "create_evaluation_period": "require_admin",
            "update_evaluation_period_status": "require_admin",
            "delete_evaluation_period": "require_admin",
            "get_active_period": "require_staff",
            "enroll_section_in_period": "require_admin",
            "get_enrolled_sections": "require_staff",
            "remove_enrolled_section": "require_admin",
            "get_enrolled_program_sections": "require_staff",
            "remove_enrolled_program_section": "require_admin",
            "enroll_program_section": "require_admin",
            
            # Course Management - Admin only
            "get_all_courses": "require_staff",
            "create_course": "require_admin",
            "update_course": "require_admin",
            "delete_course": "require_admin",
            
            # Program/Section Management - Admin only
            "get_programs": "require_staff",
            "get_sections": "require_staff",
            "create_section": "require_admin",
            "update_section": "require_admin",
            "delete_section": "require_admin",
            "get_section_students": "require_staff",
            "get_available_students": "require_admin",
            "enroll_student_in_section": "require_admin",
            "bulk_enroll_students": "require_admin",
            "remove_student_from_section": "require_admin",
            
            # Audit & Export - Admin/Staff
            "get_audit_logs": "require_staff",
            "get_audit_stats": "require_staff",
            "get_export_history": "require_staff",
            "export_users": "require_staff",
            "export_evaluations": "require_staff",
            "export_courses": "require_staff",
            "export_analytics": "require_staff",
            "export_audit_logs": "require_admin",
            "export_custom": "require_staff",
            
            # Dashboard & System - Staff
            "get_dashboard_stats": "require_staff",
            "send_notification": "require_admin",
            "get_email_config_status": "require_admin",
            
            # Backup - Admin only
            "create_backup": "require_admin",
            "restore_backup": "require_admin",
            "get_backup_history": "require_admin",
            
            # Program Sections - Admin/Staff
            "get_program_sections": "require_staff",
            "create_program_section": "require_admin",
            "update_program_section": "require_admin",
            "delete_program_section": "require_admin",
            "get_program_section_students": "require_staff",
        }
    },
    
    "admin.py": {
        "import": "from middleware.auth import require_staff",
        "default_auth": "require_staff"  # All endpoints require staff
    },
    
    "secretary.py": {
        "import": "from middleware.auth import require_staff",
        "default_auth": "require_staff"  # All endpoints require staff
    },
    
    "department_head.py": {
        "import": "from middleware.auth import require_staff",
        "default_auth": "require_staff"  # All endpoints require staff
    },
    
    "student.py": {
        "import": "from middleware.auth import get_current_user, require_student",
        "default_auth": "require_student",  # Most endpoints require student
        "check_ownership": True  # Need to verify student accesses own data
    }
}

def add_auth_import(file_path: str, import_line: str):
    """Add authentication import to a route file"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if import already exists
    if 'from middleware.auth import' in content:
        print(f"  ✓ {os.path.basename(file_path)} already has auth import")
        return
    
    # Find the imports section (after from fastapi import)
    pattern = r'(from fastapi import [^\n]+\n)'
    match = re.search(pattern, content)
    
    if match:
        insert_pos = match.end()
        new_content = content[:insert_pos] + import_line + '\n' + content[insert_pos:]
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print(f"  ✓ Added auth import to {os.path.basename(file_path)}")
    else:
        print(f"  ✗ Could not find import section in {os.path.basename(file_path)}")

def main():
    """Add authentication imports to all route files"""
    print("\n" + "="*80)
    print("ADDING AUTHENTICATION IMPORTS TO ROUTE FILES")
    print("="*80 + "\n")
    
    base_path = Path("c:/Users/Jose Iturralde/Documents/1 thesis/Back/App/routes")
    
    if not base_path.exists():
        print(f"❌ Routes directory not found: {base_path}")
        return
    
    for filename, config in ROUTE_CONFIGS.items():
        file_path = base_path / filename
        
        if not file_path.exists():
            print(f"⚠️  File not found: {filename}")
            continue
        
        print(f"\n📝 Processing {filename}...")
        add_auth_import(str(file_path), config["import"])
    
    print("\n" + "="*80)
    print("✅ AUTHENTICATION IMPORTS ADDED")
    print("="*80 + "\n")
    
    print("NEXT STEPS:")
    print("1. Manually add authentication parameters to each endpoint")
    print("2. For student routes, add ownership checks")
    print("3. Test authentication with Postman/frontend")
    print("\nExample:")
    print("  async def get_users(..., current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):")
    print()

if __name__ == "__main__":
    main()
