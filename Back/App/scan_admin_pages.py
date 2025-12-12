"""
Admin Frontend-Backend Communication Scan
Tests all API endpoints used by admin pages
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

def login_admin():
    """Login as admin and get token"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@lpubatangas.edu.ph",
        "password": "changeme123"
    })
    if resp.status_code == 200:
        data = resp.json()
        if data.get("success"):
            return data["token"], data["user"]["id"]
    return None, None

def test_endpoint(name, method, url, headers, data=None, params=None):
    """Test a single endpoint and return result"""
    try:
        if method == "GET":
            r = requests.get(url, headers=headers, params=params, timeout=10)
        elif method == "POST":
            r = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == "PUT":
            r = requests.put(url, headers=headers, json=data, timeout=10)
        elif method == "DELETE":
            r = requests.delete(url, headers=headers, timeout=10)
        else:
            return (name, "❌", f"Unknown method: {method}")
        
        if r.status_code == 200:
            try:
                response_data = r.json()
                # Get a summary of the response
                if isinstance(response_data, dict):
                    keys = list(response_data.keys())[:5]
                    summary = f"Keys: {keys}"
                elif isinstance(response_data, list):
                    summary = f"{len(response_data)} items"
                else:
                    summary = str(response_data)[:50]
                return (name, "✅", summary)
            except:
                return (name, "✅", f"Status {r.status_code}")
        elif r.status_code == 404:
            return (name, "❌", "Not Found (404)")
        elif r.status_code == 422:
            return (name, "⚠️", f"Validation Error: {r.text[:80]}")
        elif r.status_code == 500:
            return (name, "❌", f"Server Error: {r.text[:80]}")
        else:
            return (name, "⚠️", f"Status {r.status_code}: {r.text[:50]}")
    except requests.Timeout:
        return (name, "⚠️", "Timeout")
    except Exception as e:
        return (name, "❌", str(e)[:50])

def scan_admin_dashboard(headers, user_id):
    """Test AdminDashboard.jsx API calls"""
    print("\n" + "="*70)
    print("📊 ADMIN DASHBOARD (AdminDashboard.jsx)")
    print("="*70)
    
    endpoints = [
        ("Dashboard Stats", "GET", f"{BASE_URL}/api/admin/dashboard-stats"),
    ]
    
    results = []
    for name, method, url in endpoints:
        result = test_endpoint(name, method, url, headers)
        results.append(result)
        print(f"{result[1]} {result[0]}: {result[2]}")
    
    return results

def scan_user_management(headers, user_id):
    """Test UserManagement.jsx API calls"""
    print("\n" + "="*70)
    print("👥 USER MANAGEMENT (UserManagement.jsx)")
    print("="*70)
    
    results = []
    
    # GET Users
    result = test_endpoint("Get Users", "GET", f"{BASE_URL}/api/admin/users", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    # GET Users with filters
    result = test_endpoint("Get Users (filtered)", "GET", 
        f"{BASE_URL}/api/admin/users?role=admin&page=1&page_size=10", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    # GET User Stats
    result = test_endpoint("User Stats", "GET", f"{BASE_URL}/api/admin/users/stats", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    # GET Programs (for dropdown)
    result = test_endpoint("Programs List", "GET", f"{BASE_URL}/api/admin/programs", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    # GET Departments (for dropdown)
    result = test_endpoint("Departments List", "GET", f"{BASE_URL}/api/admin/departments", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    return results

def scan_evaluation_periods(headers, user_id):
    """Test EvaluationPeriodManagement.jsx API calls"""
    print("\n" + "="*70)
    print("📅 EVALUATION PERIODS (EvaluationPeriodManagement.jsx)")
    print("="*70)
    
    results = []
    
    # GET Evaluation Periods
    result = test_endpoint("Get Periods", "GET", f"{BASE_URL}/api/admin/evaluation-periods", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    # GET Active Period
    result = test_endpoint("Active Period", "GET", f"{BASE_URL}/api/admin/evaluation-periods/active", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    # Also check the other evaluation-periods route
    result = test_endpoint("Periods (alt)", "GET", f"{BASE_URL}/api/evaluation-periods", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    result = test_endpoint("Active (alt)", "GET", f"{BASE_URL}/api/evaluation-periods/active", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    return results

def scan_course_management(headers, user_id):
    """Test EnhancedCourseManagement.jsx API calls"""
    print("\n" + "="*70)
    print("📚 COURSE MANAGEMENT (EnhancedCourseManagement.jsx)")
    print("="*70)
    
    results = []
    
    # GET Courses
    result = test_endpoint("Get Courses", "GET", f"{BASE_URL}/api/admin/courses", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    # GET Courses with filters
    result = test_endpoint("Get Courses (filtered)", "GET", 
        f"{BASE_URL}/api/admin/courses?page=1&page_size=20", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    # GET Programs
    result = test_endpoint("Programs for dropdown", "GET", f"{BASE_URL}/api/admin/programs", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    return results

def scan_student_management(headers, user_id):
    """Test StudentManagement.jsx API calls"""
    print("\n" + "="*70)
    print("🎓 STUDENT MANAGEMENT (StudentManagement.jsx)")
    print("="*70)
    
    results = []
    
    # GET Students (users with role=student)
    result = test_endpoint("Get Students", "GET", 
        f"{BASE_URL}/api/admin/users?role=student", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    # GET Programs
    result = test_endpoint("Programs", "GET", f"{BASE_URL}/api/admin/programs", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    # Student advancement endpoint
    result = test_endpoint("Year Levels", "GET", f"{BASE_URL}/api/student-management/year-levels", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    return results

def scan_program_sections(headers, user_id):
    """Test ProgramSections.jsx API calls"""
    print("\n" + "="*70)
    print("📋 PROGRAM SECTIONS (ProgramSections.jsx)")
    print("="*70)
    
    results = []
    
    # GET Sections
    result = test_endpoint("Get Sections", "GET", f"{BASE_URL}/api/admin/sections", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    # GET Program Sections
    result = test_endpoint("Program Sections", "GET", f"{BASE_URL}/api/admin/program-sections", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    # GET Programs
    result = test_endpoint("Programs", "GET", f"{BASE_URL}/api/admin/programs", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    return results

def scan_enrollment_list(headers, user_id):
    """Test EnrollmentListManagement.jsx API calls"""
    print("\n" + "="*70)
    print("📝 ENROLLMENT LIST (EnrollmentListManagement.jsx)")
    print("="*70)
    
    results = []
    
    # GET Enrollment data
    result = test_endpoint("Section Students", "GET", f"{BASE_URL}/api/admin/section-students", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    # GET Program Sections for dropdown
    result = test_endpoint("Program Sections", "GET", f"{BASE_URL}/api/admin/program-sections", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    return results

def scan_non_respondents(headers, user_id):
    """Test NonRespondents.jsx API calls"""
    print("\n" + "="*70)
    print("⚠️ NON-RESPONDENTS (NonRespondents.jsx)")
    print("="*70)
    
    results = []
    
    # GET Non-respondents
    result = test_endpoint("Non-Respondents", "GET", f"{BASE_URL}/api/admin/non-respondents", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    # GET Evaluation Periods for filter
    result = test_endpoint("Periods for filter", "GET", f"{BASE_URL}/api/admin/evaluation-periods", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    return results

def scan_audit_logs(headers, user_id):
    """Test AuditLogViewer.jsx API calls"""
    print("\n" + "="*70)
    print("📜 AUDIT LOGS (AuditLogViewer.jsx)")
    print("="*70)
    
    results = []
    
    # GET Audit Logs
    result = test_endpoint("Audit Logs", "GET", f"{BASE_URL}/api/admin/audit-logs", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    # GET Audit Log Stats
    result = test_endpoint("Audit Stats", "GET", f"{BASE_URL}/api/admin/audit-logs/stats", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    return results

def scan_data_export(headers, user_id):
    """Test DataExportCenter.jsx API calls"""
    print("\n" + "="*70)
    print("📤 DATA EXPORT (DataExportCenter.jsx)")
    print("="*70)
    
    results = []
    
    # GET Export History
    result = test_endpoint("Export History", "GET", f"{BASE_URL}/api/admin/export/history", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    # Export endpoints (these return files, just check they exist)
    result = test_endpoint("Export Users Check", "GET", f"{BASE_URL}/api/admin/export/users", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    result = test_endpoint("Export Evaluations Check", "GET", f"{BASE_URL}/api/admin/export/evaluations", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    return results

def scan_email_notifications(headers, user_id):
    """Test EmailNotifications.jsx API calls"""
    print("\n" + "="*70)
    print("📧 EMAIL NOTIFICATIONS (EmailNotifications.jsx)")
    print("="*70)
    
    results = []
    
    # GET Email Config Status
    result = test_endpoint("Email Config", "GET", 
        f"{BASE_URL}/api/admin/email-config-status?current_user_id={user_id}", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    # GET Users for recipient selection
    result = test_endpoint("Users for emails", "GET", f"{BASE_URL}/api/admin/users", headers)
    results.append(result)
    print(f"{result[1]} {result[0]}: {result[2]}")
    
    return results

def main():
    print("🔍 ADMIN FRONTEND-BACKEND COMMUNICATION SCAN")
    print("=" * 70)
    print(f"Backend: {BASE_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # Login
    token, user_id = login_admin()
    if not token:
        print("❌ Admin login failed! Cannot proceed.")
        return
    
    print(f"✅ Admin logged in (user_id={user_id})")
    headers = {"Authorization": f"Bearer {token}"}
    
    all_results = []
    
    # Scan each admin page
    all_results.extend(scan_admin_dashboard(headers, user_id))
    all_results.extend(scan_user_management(headers, user_id))
    all_results.extend(scan_evaluation_periods(headers, user_id))
    all_results.extend(scan_course_management(headers, user_id))
    all_results.extend(scan_student_management(headers, user_id))
    all_results.extend(scan_program_sections(headers, user_id))
    all_results.extend(scan_enrollment_list(headers, user_id))
    all_results.extend(scan_non_respondents(headers, user_id))
    all_results.extend(scan_audit_logs(headers, user_id))
    all_results.extend(scan_data_export(headers, user_id))
    all_results.extend(scan_email_notifications(headers, user_id))
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 SUMMARY")
    print("=" * 70)
    
    working = sum(1 for r in all_results if r[1] == "✅")
    warnings = sum(1 for r in all_results if r[1] == "⚠️")
    failed = sum(1 for r in all_results if r[1] == "❌")
    total = len(all_results)
    
    print(f"✅ Working: {working}/{total}")
    print(f"⚠️ Warnings: {warnings}/{total}")
    print(f"❌ Failed: {failed}/{total}")
    print(f"📊 Success Rate: {(working/total*100):.1f}%")
    
    if failed > 0:
        print("\n❌ FAILED ENDPOINTS:")
        for r in all_results:
            if r[1] == "❌":
                print(f"   - {r[0]}: {r[2]}")
    
    if warnings > 0:
        print("\n⚠️ WARNING ENDPOINTS:")
        for r in all_results:
            if r[1] == "⚠️":
                print(f"   - {r[0]}: {r[2]}")

if __name__ == "__main__":
    main()
