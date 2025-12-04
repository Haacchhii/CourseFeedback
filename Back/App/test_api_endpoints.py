"""
Test script to verify sentiment and anomaly endpoints return data correctly
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def test_secretary_endpoints():
    """Test secretary endpoints"""
    print("=" * 80)
    print("TESTING SECRETARY ENDPOINTS")
    print("=" * 80)
    
    # Test sentiment analysis
    print("\n1. Testing /secretary/sentiment-analysis")
    try:
        response = requests.get(f"{BASE_URL}/secretary/sentiment-analysis?user_id=2")
        data = response.json()
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Success: {data.get('success')}")
            if 'data' in data:
                summary = data['data'].get('summary', {})
                trends = data['data'].get('trends', [])
                total = data['data'].get('total_evaluations', 0)
                print(f"Total evaluations: {total}")
                print(f"Summary: {json.dumps(summary, indent=2)}")
                print(f"Trends count: {len(trends)}")
                if trends:
                    print(f"First trend: {json.dumps(trends[0], indent=2)}")
        else:
            print(f"Error: {data}")
    except Exception as e:
        print(f"Exception: {e}")
    
    # Test anomalies
    print("\n2. Testing /secretary/anomalies")
    try:
        response = requests.get(f"{BASE_URL}/secretary/anomalies?user_id=2")
        data = response.json()
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Success: {data.get('success')}")
            if 'data' in data:
                anomalies = data.get('data', [])
                pagination = data.get('pagination', {})
                print(f"Anomalies count: {len(anomalies)}")
                print(f"Pagination: {json.dumps(pagination, indent=2)}")
                if anomalies:
                    print(f"First anomaly: {json.dumps(anomalies[0], indent=2)}")
        else:
            print(f"Error: {data}")
    except Exception as e:
        print(f"Exception: {e}")
    
    # Test courses
    print("\n3. Testing /secretary/courses")
    try:
        response = requests.get(f"{BASE_URL}/secretary/courses?user_id=2")
        data = response.json()
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Success: {data.get('success')}")
            if 'data' in data:
                courses = data.get('data', [])
                print(f"Courses count: {len(courses)}")
                if courses:
                    first_course = courses[0]
                    print(f"First course fields: {', '.join(first_course.keys())}")
                    print(f"Sample course:")
                    print(f"  Name: {first_course.get('name')}")
                    print(f"  Enrollment Count: {first_course.get('enrollmentCount')}")
                    print(f"  Evaluation Count: {first_course.get('evaluationCount')}")
                    print(f"  Response Rate: {first_course.get('responseRate')}%")
                    print(f"  Overall Rating: {first_course.get('overallRating')}")
        else:
            print(f"Error: {data}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    test_secretary_endpoints()
    print("\n" + "=" * 80)
    print("TESTING COMPLETE")
    print("=" * 80)
