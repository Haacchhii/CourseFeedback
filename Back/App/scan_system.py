"""
Comprehensive System Scan for Course Feedback System
Tests all API endpoints and identifies working/broken features
"""

import requests
import json
from datetime import datetime

BASE_URL = 'http://127.0.0.1:8000'

# ANSI colors
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

TOKEN = None
RESULTS = {
    'working': [],
    'broken': [],
    'auth_required': []
}

def login(email, password):
    """Attempt to login and get token"""
    global TOKEN
    try:
        resp = requests.post(f'{BASE_URL}/api/auth/login', 
                           json={'email': email, 'password': password}, 
                           timeout=5)
        if resp.status_code == 200:
            data = resp.json()
            if data.get('success') and data.get('token'):
                TOKEN = data['token']
                return data
        return None
    except Exception as e:
        print(f'Login error: {e}')
        return None

def test_endpoint(method, path, name, auth=True):
    """Test an endpoint and record result"""
    headers = {'Authorization': f'Bearer {TOKEN}'} if auth and TOKEN else {}
    try:
        resp = requests.request(method, f'{BASE_URL}{path}', headers=headers, timeout=10)
        
        result = {
            'name': name,
            'path': path,
            'method': method,
            'status': resp.status_code,
            'success': resp.status_code < 400
        }
        
        if resp.status_code < 400:
            RESULTS['working'].append(result)
            status = f'{GREEN}✅ PASS{RESET}'
        elif resp.status_code == 401 or resp.status_code == 403:
            RESULTS['auth_required'].append(result)
            status = f'{YELLOW}🔐 AUTH{RESET}'
        else:
            RESULTS['broken'].append(result)
            status = f'{RED}❌ FAIL{RESET}'
            
            # Try to get error message
            try:
                err = resp.json()
                result['error'] = err.get('detail', str(err)[:100])
            except:
                result['error'] = resp.text[:100]
        
        print(f'{status} [{resp.status_code:3}] {name:40} {path}')
        return result
        
    except requests.exceptions.Timeout:
        RESULTS['broken'].append({'name': name, 'path': path, 'error': 'Timeout'})
        print(f'{RED}⏱️  TIMEOUT{RESET} {name:40} {path}')
    except Exception as e:
        RESULTS['broken'].append({'name': name, 'path': path, 'error': str(e)})
        print(f'{RED}❌ ERROR{RESET} {name:40} {str(e)[:50]}')

def print_section(title):
    print(f'\n{BLUE}{"="*80}{RESET}')
    print(f'{BLUE}{title:^80}{RESET}')
    print(f'{BLUE}{"="*80}{RESET}\n')

def main():
    global TOKEN
    
    print(f'\n{YELLOW}🔍 COMPREHENSIVE SYSTEM SCAN{RESET}')
    print(f'{YELLOW}Testing backend at: {BASE_URL}{RESET}')
    print(f'{YELLOW}Timestamp: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}{RESET}\n')
    
    # Test login
    print_section('AUTHENTICATION TESTING')
    
    # Try admin login
    print('Testing admin login (admin@lpubatangas.edu.ph)...')
    result = login('admin@lpubatangas.edu.ph', 'admin123')
    if result:
        user = result.get('user', {})
        print(f'{GREEN}✅ Admin login successful{RESET}')
        print(f'   User: {user.get("email")} | Role: {user.get("role")}')
        print(f'   Token: {TOKEN[:30]}...')
    else:
        print(f'{RED}❌ Admin login failed{RESET}')
        # Try alternate credentials
        result = login('admin@lpubatangas.edu.ph', 'admin123')
        if result:
            print(f'{GREEN}✅ Alternate admin login successful{RESET}')
        else:
            print(f'{YELLOW}⚠️ No admin token - some tests may fail{RESET}')
    
    # Test ADMIN endpoints
    print_section('ADMIN ROLE - Dashboard & Management')
    test_endpoint('GET', '/api/admin/dashboard-stats', 'Dashboard Statistics')
    test_endpoint('GET', '/api/admin/department-overview', 'Department Overview')
    test_endpoint('GET', '/api/admin/users', 'User List')
    test_endpoint('GET', '/api/admin/users?page=1&page_size=10', 'User List (Paginated)')
    test_endpoint('GET', '/api/admin/users/stats', 'User Statistics')
    test_endpoint('GET', '/api/admin/courses', 'Courses List')
    test_endpoint('GET', '/api/admin/programs', 'Programs List')
    test_endpoint('GET', '/api/admin/sections', 'Class Sections')
    test_endpoint('GET', '/api/admin/program-sections', 'Program Sections')
    test_endpoint('GET', '/api/admin/students', 'Students List')
    test_endpoint('GET', '/api/admin/evaluations', 'Evaluations List')
    test_endpoint('GET', '/api/admin/non-respondents', 'Non-Respondents')
    test_endpoint('GET', '/api/admin/completion-rates', 'Completion Rates')
    
    print_section('ADMIN ROLE - Evaluation Periods')
    test_endpoint('GET', '/api/admin/evaluation-periods', 'All Periods')
    test_endpoint('GET', '/api/admin/evaluation-periods/active', 'Active Period')
    
    print_section('ADMIN ROLE - Audit & Export')
    test_endpoint('GET', '/api/admin/audit-logs', 'Audit Logs')
    test_endpoint('GET', '/api/admin/audit-logs/stats', 'Audit Stats')
    test_endpoint('GET', '/api/admin/export/history', 'Export History')
    test_endpoint('GET', '/api/admin/email-config-status', 'Email Config')
    
    print_section('ADMIN ROLE - Enrollment Management')
    test_endpoint('GET', '/api/admin/enrollment-list/stats', 'Enrollment Stats')
    
    # Test SECRETARY endpoints
    print_section('SECRETARY ROLE - Dashboard & Analytics')
    test_endpoint('GET', '/api/secretary/dashboard?user_id=2', 'Secretary Dashboard')
    test_endpoint('GET', '/api/secretary/courses?user_id=2', 'Courses List')
    test_endpoint('GET', '/api/secretary/programs', 'Programs')
    test_endpoint('GET', '/api/secretary/year-levels', 'Year Levels')
    test_endpoint('GET', '/api/secretary/evaluations?user_id=2', 'Evaluations')
    test_endpoint('GET', '/api/secretary/sentiment-analysis?user_id=2', 'Sentiment Analysis')
    test_endpoint('GET', '/api/secretary/anomalies?user_id=2', 'Anomaly Detection')
    test_endpoint('GET', '/api/secretary/non-respondents?user_id=2', 'Non-Respondents')
    test_endpoint('GET', '/api/secretary/completion-rates?user_id=2', 'Completion Rates')
    test_endpoint('GET', '/api/secretary/ml-insights-summary?user_id=2', 'ML Insights')
    
    # Test DEPARTMENT HEAD endpoints  
    print_section('DEPARTMENT HEAD ROLE - Dashboard & Analytics')
    test_endpoint('GET', '/api/dept-head/dashboard?user_id=3', 'Dept Head Dashboard')
    test_endpoint('GET', '/api/dept-head/courses?user_id=3', 'Courses List')
    test_endpoint('GET', '/api/dept-head/evaluations?user_id=3', 'Evaluations')
    test_endpoint('GET', '/api/dept-head/sentiment-analysis?user_id=3', 'Sentiment Analysis')
    test_endpoint('GET', '/api/dept-head/anomalies?user_id=3', 'Anomaly Detection')
    test_endpoint('GET', '/api/dept-head/trends?user_id=3', 'Trend Analysis')
    test_endpoint('GET', '/api/dept-head/programs', 'Programs')
    test_endpoint('GET', '/api/dept-head/year-levels', 'Year Levels')
    test_endpoint('GET', '/api/dept-head/non-respondents?user_id=3', 'Non-Respondents')
    test_endpoint('GET', '/api/dept-head/completion-rates?user_id=3', 'Completion Rates')
    test_endpoint('GET', '/api/dept-head/ml-insights-summary?user_id=3', 'ML Insights')
    
    # Test STUDENT endpoints
    print_section('STUDENT ROLE - Course Evaluation')
    test_endpoint('GET', '/api/student/1/courses', 'Student Courses')
    test_endpoint('GET', '/api/student/1/evaluations', 'Student Evaluations')
    test_endpoint('GET', '/api/student/1/evaluation-history', 'Evaluation History')
    test_endpoint('GET', '/api/student/1/evaluation-periods', 'Available Periods')
    test_endpoint('GET', '/api/student/1/pending-evaluations', 'Pending Evaluations')
    
    # Test PUBLIC endpoints
    print_section('PUBLIC/COMMON ENDPOINTS')
    test_endpoint('GET', '/api/evaluation-periods/periods', 'All Periods (Public)', auth=False)
    test_endpoint('GET', '/api/evaluation-periods/periods/active', 'Active Period (Public)', auth=False)
    test_endpoint('GET', '/api/notifications', 'Notifications')
    test_endpoint('GET', '/api/notifications/unread-count', 'Unread Count')
    
    # Print Summary
    print_section('SCAN SUMMARY')
    
    total = len(RESULTS['working']) + len(RESULTS['broken']) + len(RESULTS['auth_required'])
    
    print(f'{GREEN}✅ Working Endpoints: {len(RESULTS["working"])}{RESET}')
    print(f'{RED}❌ Broken Endpoints: {len(RESULTS["broken"])}{RESET}')
    print(f'{YELLOW}🔐 Auth Issues: {len(RESULTS["auth_required"])}{RESET}')
    print(f'Total Tested: {total}')
    
    if RESULTS['broken']:
        print(f'\n{RED}BROKEN ENDPOINTS DETAILS:{RESET}')
        for item in RESULTS['broken']:
            print(f'  - {item["name"]}: {item.get("error", "Unknown error")}')
    
    # Save results to file
    with open('scan_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'results': RESULTS,
            'summary': {
                'working': len(RESULTS['working']),
                'broken': len(RESULTS['broken']),
                'auth_issues': len(RESULTS['auth_required']),
                'total': total
            }
        }, f, indent=2)
    
    print(f'\n{BLUE}Results saved to scan_results.json{RESET}')

if __name__ == '__main__':
    main()
