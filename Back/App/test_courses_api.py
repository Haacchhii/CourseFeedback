"""Test the courses API filtering"""
import requests

url = 'http://localhost:8000/api/admin/courses'
params = {
    'program_id': 1,
    'year_level': 3,
    'semester': 1,
    'page_size': 1000
}

try:
    # First login to get token
    login_resp = requests.post('http://localhost:8000/api/auth/login', json={
        'email': 'admin@lpu.edu.ph',
        'password': 'admin123'
    })
    print(f"Login response: {login_resp.status_code}")
    print(f"Login data: {login_resp.json()}")
    
    token = login_resp.json().get('access_token')
    if not token:
        print("Failed to get token!")
        exit(1)
        
    print(f"Got token: {token[:20]}...")
    
    # Now test courses
    resp = requests.get(url, params=params, headers={'Authorization': f'Bearer {token}'})
    data = resp.json()
    courses = data.get('data', [])
    print(f'\nTotal courses returned: {len(courses)}')
    print('\nFirst 10 courses:')
    for c in courses[:10]:
        print(f"  {c['subject_code']} - Year {c['year_level']} Sem {c['semester']}")
        
    # Check if any are wrong year
    wrong_year = [c for c in courses if c['year_level'] != 3]
    if wrong_year:
        print(f"\n⚠️ Found {len(wrong_year)} courses with wrong year level!")
        for c in wrong_year[:5]:
            print(f"  {c['subject_code']} - Year {c['year_level']}")
    else:
        print("\n✅ All courses are Year 3!")
        
except Exception as e:
    print(f'Error: {e}')
    import traceback
    traceback.print_exc()
