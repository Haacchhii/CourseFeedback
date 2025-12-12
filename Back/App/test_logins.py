"""Test all user logins and their dashboard endpoints"""
import requests
import json

BASE_URL = 'http://127.0.0.1:8000'

GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def test_login_and_dashboard(email, password, role_name, dashboard_endpoint):
    """Test login and dashboard for a user"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Testing: {role_name}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    # Test login
    print(f"\n📧 Email: {email}")
    try:
        resp = requests.post(f'{BASE_URL}/api/auth/login', 
                           json={'email': email, 'password': password}, 
                           timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get('success'):
                token = data.get('token')
                user = data.get('user', {})
                print(f"{GREEN}✅ Login successful!{RESET}")
                print(f"   User: {user.get('name', user.get('email'))}")
                print(f"   Role: {user.get('role')}")
                print(f"   Token: {token[:30]}..." if token else "   Token: None")
                
                # Test dashboard endpoint
                if dashboard_endpoint:
                    headers = {'Authorization': f'Bearer {token}'}
                    params = {}
                    
                    # Add user_id for staff endpoints
                    if 'secretary' in dashboard_endpoint or 'dept-head' in dashboard_endpoint:
                        params['user_id'] = user.get('id')
                    
                    dash_resp = requests.get(f'{BASE_URL}{dashboard_endpoint}', 
                                           headers=headers, params=params, timeout=10)
                    
                    if dash_resp.status_code == 200:
                        dash_data = dash_resp.json()
                        print(f"{GREEN}✅ Dashboard loaded successfully!{RESET}")
                        
                        # Print some stats
                        if dash_data.get('data'):
                            d = dash_data['data']
                            if 'totalUsers' in d:
                                print(f"   Total Users: {d.get('totalUsers')}")
                                print(f"   Total Courses: {d.get('totalCourses')}")
                                print(f"   Total Evaluations: {d.get('totalEvaluations')}")
                            elif 'total_courses' in d:
                                print(f"   Total Courses: {d.get('total_courses')}")
                                print(f"   Total Evaluations: {d.get('total_evaluations')}")
                                print(f"   Participation Rate: {d.get('participation_rate')}%")
                            elif isinstance(d, list):
                                print(f"   Courses available: {len(d)}")
                    else:
                        print(f"{RED}❌ Dashboard failed: {dash_resp.status_code}{RESET}")
                        print(f"   Error: {dash_resp.text[:100]}")
                
                return True
            else:
                print(f"{RED}❌ Login failed: {data.get('message')}{RESET}")
                return False
        else:
            print(f"{RED}❌ Login failed: HTTP {resp.status_code}{RESET}")
            print(f"   Error: {resp.text[:100]}")
            return False
            
    except Exception as e:
        print(f"{RED}❌ Error: {e}{RESET}")
        return False

# Test all users
print(f"\n{YELLOW}🔐 TESTING USER LOGINS AND DASHBOARDS{RESET}")
print(f"{YELLOW}Backend: {BASE_URL}{RESET}")
print(f"{YELLOW}Frontend: http://localhost:5173{RESET}")

# Admin
test_login_and_dashboard(
    'admin@lpubatangas.edu.ph', 
    'changeme123', 
    'ADMIN',
    '/api/admin/dashboard-stats'
)

# Secretary
test_login_and_dashboard(
    'secretary1@lpubatangas.edu.ph', 
    'secretary123', 
    'SECRETARY',
    '/api/secretary/dashboard'
)

# Student
test_login_and_dashboard(
    'iturraldejose@lpubatangas.edu.ph', 
    '@Aventon0518', 
    'STUDENT',
    '/api/student/320/courses'  # Using user_id from earlier check
)

print(f"\n{BLUE}{'='*60}{RESET}")
print(f"{GREEN}🌐 Open http://localhost:5173 in your browser to test the UI{RESET}")
print(f"{BLUE}{'='*60}{RESET}")
