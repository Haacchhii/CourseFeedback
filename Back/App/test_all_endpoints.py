"""
Comprehensive Backend API Endpoint Tester
Tests all routes to identify which ones work and which are broken
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"
TEST_RESULTS = []

# ANSI color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def test_endpoint(method, path, data=None, params=None, description=""):
    """Test a single endpoint and record results"""
    url = f"{BASE_URL}{path}"
    
    try:
        if method == "GET":
            response = requests.get(url, params=params, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, timeout=5)
        elif method == "PUT":
            response = requests.put(url, json=data, timeout=5)
        elif method == "DELETE":
            response = requests.delete(url, timeout=5)
        else:
            return None
        
        status = "✅ PASS" if response.status_code < 400 else "❌ FAIL"
        result = {
            "method": method,
            "path": path,
            "status_code": response.status_code,
            "description": description,
            "success": response.status_code < 400,
            "response_size": len(response.content),
            "has_data": bool(response.content)
        }
        
        # Try to parse JSON response
        try:
            result["response_structure"] = list(response.json().keys()) if isinstance(response.json(), dict) else "list"
        except:
            result["response_structure"] = "non-json"
        
        TEST_RESULTS.append(result)
        
        color = GREEN if result["success"] else RED
        print(f"{color}{status}{RESET} {method:6} {path:50} [{response.status_code}] {description}")
        
        return result
        
    except requests.exceptions.Timeout:
        print(f"{RED}❌ TIMEOUT{RESET} {method:6} {path:50} - Request timed out")
        TEST_RESULTS.append({
            "method": method,
            "path": path,
            "status_code": 0,
            "description": description,
            "success": False,
            "error": "Timeout"
        })
    except Exception as e:
        print(f"{RED}❌ ERROR{RESET} {method:6} {path:50} - {str(e)}")
        TEST_RESULTS.append({
            "method": method,
            "path": path,
            "status_code": 0,
            "description": description,
            "success": False,
            "error": str(e)
        })

def print_section(title):
    """Print a section header"""
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}{title:^80}{RESET}")
    print(f"{BLUE}{'='*80}{RESET}\n")

def main():
    print(f"\n{YELLOW}🔍 COMPREHENSIVE API ENDPOINT TEST{RESET}")
    print(f"{YELLOW}Testing backend at: {BASE_URL}{RESET}")
    print(f"{YELLOW}Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{RESET}\n")
    
    # Test basic health
    print_section("BASIC HEALTH CHECKS")
    test_endpoint("GET", "/", description="Root endpoint")
    test_endpoint("GET", "/health", description="Health check")
    
    # Test Auth
    print_section("AUTHENTICATION")
    test_endpoint("POST", "/api/auth/login", 
                  data={"email": "test@example.com", "password": "test"},
                  description="Login endpoint")
    
    # Test Student Routes
    print_section("STUDENT ROUTES")
    test_endpoint("GET", "/api/student/1/courses", description="Get student courses")
    test_endpoint("GET", "/api/student/1/evaluations", description="Get student evaluations")
    test_endpoint("GET", "/api/student/courses/1", description="Get course details")
    test_endpoint("POST", "/api/student/evaluations", 
                  data={
                      "class_section_id": 1,
                      "student_id": 1,
                      "ratings": {"overall": 5},
                      "comment": "Test"
                  },
                  description="Submit evaluation")
    
    # Test Admin Routes (Dashboard)
    print_section("ADMIN ROUTES - Dashboard & Overview")
    test_endpoint("GET", "/api/admin/dashboard-stats", description="Dashboard statistics")
    test_endpoint("GET", "/api/admin/department-overview", description="Department overview")
    test_endpoint("GET", "/api/admin/departments", description="List departments")
    test_endpoint("GET", "/api/admin/students", description="List students")
    test_endpoint("GET", "/api/admin/instructors", description="List instructors")
    test_endpoint("GET", "/api/admin/evaluations", description="List evaluations")
    test_endpoint("GET", "/api/admin/courses", description="List courses")
    
    # Test System Admin Routes (User Management)
    print_section("SYSTEM ADMIN ROUTES - User Management")
    test_endpoint("GET", "/api/admin/users", description="List all users")
    test_endpoint("GET", "/api/admin/users", params={"page": 1, "page_size": 10}, description="List users with pagination")
    test_endpoint("GET", "/api/admin/users/stats", description="User statistics")
    
    # Test Evaluation Periods
    print_section("SYSTEM ADMIN ROUTES - Evaluation Periods")
    test_endpoint("GET", "/api/admin/evaluation-periods", description="List evaluation periods")
    test_endpoint("GET", "/api/admin/evaluation-periods/active", description="Get active period")
    
    # Test Settings
    print_section("SYSTEM ADMIN ROUTES - Settings")
    test_endpoint("GET", "/api/admin/settings/general", description="Get general settings")
    test_endpoint("GET", "/api/admin/settings/email", description="Get email settings")
    test_endpoint("GET", "/api/admin/settings/security", description="Get security settings")
    
    # Test Audit Logs
    print_section("SYSTEM ADMIN ROUTES - Audit Logs")
    test_endpoint("GET", "/api/admin/audit-logs", description="Get audit logs")
    test_endpoint("GET", "/api/admin/audit-logs/stats", description="Audit log statistics")
    
    # Test Export
    print_section("SYSTEM ADMIN ROUTES - Data Export")
    test_endpoint("GET", "/api/admin/export/users", description="Export users")
    test_endpoint("GET", "/api/admin/export/evaluations", description="Export evaluations")
    
    # Test Instructor Routes
    print_section("INSTRUCTOR ROUTES")
    test_endpoint("GET", "/api/instructor/dashboard", params={"user_id": 1}, description="Instructor dashboard")
    test_endpoint("GET", "/api/instructor/courses", params={"user_id": 1}, description="Instructor courses")
    test_endpoint("GET", "/api/instructor/evaluations", params={"user_id": 1}, description="Instructor evaluations")
    test_endpoint("GET", "/api/instructor/sentiment-analysis", params={"user_id": 1}, description="Sentiment analysis")
    test_endpoint("GET", "/api/instructor/anomalies", params={"user_id": 1}, description="Anomaly detection")
    test_endpoint("GET", "/api/instructor/questions", params={"user_id": 1}, description="Evaluation questions")
    
    # Test Secretary Routes
    print_section("SECRETARY ROUTES")
    test_endpoint("GET", "/api/secretary/dashboard", params={"user_id": 1}, description="Secretary dashboard")
    test_endpoint("GET", "/api/secretary/courses", params={"user_id": 1}, description="List courses")
    test_endpoint("GET", "/api/secretary/programs", params={"user_id": 1}, description="List programs")
    test_endpoint("GET", "/api/secretary/reports/evaluations-summary", params={"user_id": 1}, description="Evaluations summary")
    
    # Test Department Head Routes
    print_section("DEPARTMENT HEAD ROUTES")
    test_endpoint("GET", "/api/dept-head/dashboard", params={"user_id": 1}, description="Dept head dashboard")
    test_endpoint("GET", "/api/dept-head/evaluations", params={"user_id": 1}, description="Department evaluations")
    test_endpoint("GET", "/api/dept-head/sentiment-analysis", params={"user_id": 1}, description="Sentiment analysis")
    test_endpoint("GET", "/api/dept-head/courses", params={"user_id": 1}, description="Department courses")
    test_endpoint("GET", "/api/dept-head/instructors", params={"user_id": 1}, description="Department instructors")
    test_endpoint("GET", "/api/dept-head/anomalies", params={"user_id": 1}, description="Anomaly detection")
    test_endpoint("GET", "/api/dept-head/trends", params={"user_id": 1}, description="Trend analysis")
    
    # Print Summary
    print_section("TEST SUMMARY")
    
    total = len(TEST_RESULTS)
    passed = sum(1 for r in TEST_RESULTS if r["success"])
    failed = total - passed
    pass_rate = (passed / total * 100) if total > 0 else 0
    
    print(f"Total Endpoints Tested: {total}")
    print(f"{GREEN}Passed: {passed}{RESET}")
    print(f"{RED}Failed: {failed}{RESET}")
    print(f"Pass Rate: {pass_rate:.1f}%\n")
    
    # Group results by status code
    print(f"\n{YELLOW}Results by Status Code:{RESET}")
    status_codes = {}
    for result in TEST_RESULTS:
        code = result["status_code"]
        status_codes[code] = status_codes.get(code, 0) + 1
    
    for code, count in sorted(status_codes.items()):
        code_name = {
            0: "Connection Error",
            200: "OK",
            201: "Created",
            400: "Bad Request",
            401: "Unauthorized",
            404: "Not Found",
            422: "Validation Error",
            500: "Server Error"
        }.get(code, "Unknown")
        
        color = GREEN if code < 400 else RED
        print(f"  {color}{code:3} {code_name:20}{RESET} - {count} endpoints")
    
    # Failed endpoints detail
    if failed > 0:
        print(f"\n{RED}❌ FAILED ENDPOINTS:{RESET}")
        for result in TEST_RESULTS:
            if not result["success"]:
                error = result.get("error", f"HTTP {result['status_code']}")
                print(f"  {result['method']:6} {result['path']:50} - {error}")
    
    # Save results to JSON
    output_file = "test_results.json"
    with open(output_file, 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "total": total,
            "passed": passed,
            "failed": failed,
            "pass_rate": pass_rate,
            "results": TEST_RESULTS
        }, f, indent=2)
    
    print(f"\n{BLUE}📄 Detailed results saved to: {output_file}{RESET}\n")

if __name__ == "__main__":
    main()
