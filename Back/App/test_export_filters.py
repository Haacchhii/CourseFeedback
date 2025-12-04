"""
Test Export Endpoints with Filters
Diagnose issues with export filtering and CSV generation
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

# You'll need to login first and get a token
TOKEN = None  # Will be set after login

def login():
    """Login to get authentication token"""
    global TOKEN
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@lpubatangas.edu.ph",
        "password": "admin123"
    })
    if response.status_code == 200:
        data = response.json()
        TOKEN = data.get('token')
        print(f"✅ Login successful! Token: {TOKEN[:20]}...")
        return True
    else:
        print(f"❌ Login failed: {response.text}")
        return False

def test_export_users_no_filters():
    """Test users export without filters"""
    print("\n" + "="*80)
    print("TEST 1: Export All Users (No Filters)")
    print("="*80)
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    params = {"format": "json"}
    
    response = requests.get(f"{BASE_URL}/admin/export/users", params=params, headers=headers)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success!")
        print(f"   Records returned: {len(data.get('data', []))}")
        if data.get('data'):
            print(f"   Sample record: {json.dumps(data['data'][0], indent=2)}")
    else:
        print(f"❌ Failed: {response.text}")

def test_export_users_with_filters():
    """Test users export WITH filters"""
    print("\n" + "="*80)
    print("TEST 2: Export Users with Filters (role=student)")
    print("="*80)
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    params = {
        "format": "json",
        "role": "student",
        "status": "active"
    }
    
    response = requests.get(f"{BASE_URL}/admin/export/users", params=params, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Request URL: {response.url}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success!")
        print(f"   Records returned: {len(data.get('data', []))}")
        
        # Check if filtering worked
        students_only = all(user.get('role') == 'student' for user in data.get('data', []))
        print(f"   All records are students: {students_only}")
        
        if data.get('data'):
            print(f"   Sample record: {json.dumps(data['data'][0], indent=2)}")
    else:
        print(f"❌ Failed: {response.text}")

def test_export_evaluations_no_filters():
    """Test evaluations export without filters"""
    print("\n" + "="*80)
    print("TEST 3: Export All Evaluations (No Filters)")
    print("="*80)
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    params = {"format": "json"}
    
    response = requests.get(f"{BASE_URL}/admin/export/evaluations", params=params, headers=headers)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success!")
        print(f"   Records returned: {len(data.get('data', []))}")
        if data.get('data'):
            print(f"   Sample record fields: {list(data['data'][0].keys())}")
    else:
        print(f"❌ Failed: {response.text}")

def test_export_courses_with_filters():
    """Test courses export with program filter"""
    print("\n" + "="*80)
    print("TEST 4: Export Courses with Program Filter")
    print("="*80)
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    params = {
        "format": "json",
        "program": "BSCS",
        "status": "active"
    }
    
    response = requests.get(f"{BASE_URL}/admin/export/courses", params=params, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Request URL: {response.url}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success!")
        print(f"   Records returned: {len(data.get('data', []))}")
        
        if data.get('data'):
            # Check programs
            programs = set(course.get('program_code') for course in data.get('data', []))
            print(f"   Programs in results: {programs}")
            print(f"   Sample record: {json.dumps(data['data'][0], indent=2)}")
    else:
        print(f"❌ Failed: {response.text}")

def test_csv_export():
    """Test CSV format export"""
    print("\n" + "="*80)
    print("TEST 5: Export to CSV Format")
    print("="*80)
    
    headers = {"Authorization": f"Bearer {TOKEN}"}
    params = {
        "format": "csv",
        "role": "student"
    }
    
    response = requests.get(f"{BASE_URL}/admin/export/users", params=params, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Content-Type: {response.headers.get('content-type')}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Success!")
        print(f"   Data structure: {type(data)}")
        print(f"   Keys: {data.keys() if isinstance(data, dict) else 'Not a dict'}")
        print(f"   Records: {len(data.get('data', []))}")
    else:
        print(f"❌ Failed: {response.text}")

def main():
    print("🔍 EXPORT FUNCTIONALITY DIAGNOSTIC TOOL")
    print("="*80)
    
    if not login():
        print("\n❌ Cannot proceed without authentication")
        return
    
    # Run all tests
    test_export_users_no_filters()
    test_export_users_with_filters()
    test_export_evaluations_no_filters()
    test_export_courses_with_filters()
    test_csv_export()
    
    print("\n" + "="*80)
    print("DIAGNOSTIC COMPLETE")
    print("="*80)
    print("\n📋 EXPECTED ISSUES:")
    print("1. Filters might not be properly applied to queries")
    print("2. CSV exports might return JSON instead of actual CSV")
    print("3. Data might not match the filter criteria")
    print("\n📝 FIXES NEEDED:")
    print("1. Ensure backend endpoints properly apply filters")
    print("2. Frontend should pass correct filter parameter names")
    print("3. CSV conversion should happen in backend, not frontend")

if __name__ == "__main__":
    main()
