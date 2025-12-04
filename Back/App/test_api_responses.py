import requests
import json

# Test the actual API endpoint
base_url = "http://127.0.0.1:8000"

print("\n=== Testing Student Evaluation History API ===")
print(f"Student ID: 24")

# Test evaluation history endpoint
url = f"{base_url}/api/student/24/evaluation-history"
print(f"\nCalling: {url}")

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nResponse structure:")
        print(f"- success: {data.get('success')}")
        print(f"- evaluations count: {len(data.get('evaluations', []))}")
        print(f"- available_periods count: {len(data.get('available_periods', []))}")
        
        if data.get('evaluations'):
            print(f"\nFirst 3 evaluations:")
            for i, eval in enumerate(data['evaluations'][:3]):
                print(f"\n{i+1}. {eval['course']['subject_name']}")
                print(f"   - Class Code: {eval['course']['class_code']}")
                print(f"   - Period: {eval['evaluation_period']['name']}")
                print(f"   - Evaluation ID: {eval.get('evaluation_id')}")
                print(f"   - Submission Date: {eval.get('submission_date')}")
                print(f"   - Status: {'Evaluated' if eval.get('submission_date') else 'No Response'}")
        else:
            print("\n✗ No evaluations returned!")
            
        if data.get('available_periods'):
            print(f"\nAvailable periods:")
            for period in data['available_periods']:
                print(f"  - {period['name']} ({period['status']}) - {period['evaluation_count']} evaluations")
        else:
            print("\n✗ No available periods!")
            
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Exception: {e}")

print("\n=== Testing Student Courses API ===")
url = f"{base_url}/api/student/24/courses"
print(f"\nCalling: {url}")

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nCourses found: {len(data.get('courses', []))}")
        if data.get('courses'):
            print("Sample courses:")
            for course in data['courses'][:3]:
                print(f"  - {course['name']} ({course['code']})")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"Exception: {e}")
