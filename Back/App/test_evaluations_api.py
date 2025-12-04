import requests
import json

# Test the evaluations endpoint
url = "http://127.0.0.1:8000/api/secretary/evaluations"
params = {
    "page": 1,
    "page_size": 2
}

try:
    response = requests.get(url, params=params)
    data = response.json()
    
    print("=" * 70)
    print("EVALUATIONS API TEST")
    print("=" * 70)
    
    if "data" in data:
        evaluations = data["data"]
        print(f"\nTotal evaluations returned: {len(evaluations)}")
        
        if evaluations:
            print(f"\nFirst evaluation fields:")
            first_eval = evaluations[0]
            for key in sorted(first_eval.keys()):
                print(f"  {key:25s}: {first_eval[key]}")
            
            # Check for year_level specifically
            print(f"\n{'=' * 70}")
            print("YEAR LEVEL CHECK")
            print("=" * 70)
            for i, ev in enumerate(evaluations, 1):
                year_level = ev.get('year_level', 'NOT FOUND')
                yearLevel = ev.get('yearLevel', 'NOT FOUND')
                student_id = ev.get('student_id')
                print(f"\nEvaluation {i}:")
                print(f"  student_id: {student_id}")
                print(f"  year_level: {year_level}")
                print(f"  yearLevel: {yearLevel}")
    else:
        print("No 'data' key in response")
        print(json.dumps(data, indent=2))
        
except Exception as e:
    print(f"Error: {e}")
