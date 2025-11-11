"""
Test All API Endpoints
Verifies that all routes work with proper data
"""

from database.connection import engine
from sqlalchemy import text
import requests
import json

def test_endpoints():
    """Test all critical endpoints"""
    base_url = "http://127.0.0.1:8000/api"
    
    print("=" * 70)
    print("TESTING API ENDPOINTS")
    print("=" * 70)
    
    # Get a test student ID
    with engine.connect() as conn:
        student_result = conn.execute(text("SELECT id, user_id FROM students LIMIT 1")).fetchone()
        if not student_result:
            print("❌ No students found in database")
            return
        
        student_id = student_result[0]
        user_id = student_result[1]
        
        instructor_result = conn.execute(text("SELECT user_id FROM instructors LIMIT 1")).fetchone()
        instructor_user_id = instructor_result[0] if instructor_result else None
        
        print(f"\n📝 Test Data:")
        print(f"  Student ID: {student_id}")
        print(f"  Student User ID: {user_id}")
        print(f"  Instructor User ID: {instructor_user_id}")
    
    # Test endpoints
    tests = [
        {
            "name": "Student Courses",
            "url": f"{base_url}/student/{student_id}/courses",
            "method": "GET"
        },
        {
            "name": "Student Evaluations",
            "url": f"{base_url}/student/{student_id}/evaluations",
            "method": "GET"
        },
        {
            "name": "Instructor Dashboard",
            "url": f"{base_url}/instructor/dashboard?user_id={instructor_user_id}",
            "method": "GET"
        },
        {
            "name": "Instructor Courses",
            "url": f"{base_url}/instructor/courses?user_id={instructor_user_id}",
            "method": "GET"
        },
        {
            "name": "Admin Dashboard Stats",
            "url": f"{base_url}/admin/dashboard-stats",
            "method": "GET"
        },
    ]
    
    print("\n" + "=" * 70)
    print("ENDPOINT TESTS")
    print("=" * 70)
    
    for test in tests:
        try:
            print(f"\n🔍 Testing: {test['name']}")
            print(f"   URL: {test['url']}")
            
            if test['method'] == 'GET':
                response = requests.get(test['url'], timeout=5)
            else:
                response = requests.post(test['url'], json=test.get('data', {}), timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ SUCCESS - Status: {response.status_code}")
                if isinstance(data, dict) and 'data' in data:
                    print(f"   📊 Data keys: {list(data.keys())}")
                    if isinstance(data['data'], dict):
                        print(f"   📋 Data content: {list(data['data'].keys())}")
                    elif isinstance(data['data'], list):
                        print(f"   📋 Data count: {len(data['data'])} items")
            else:
                print(f"   ❌ FAILED - Status: {response.status_code}")
                print(f"   Error: {response.text[:200]}")
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ CONNECTION ERROR - Is backend running on port 8000?")
        except Exception as e:
            print(f"   ❌ ERROR: {str(e)}")
    
    print("\n" + "=" * 70)
    print("TEST COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    test_endpoints()
