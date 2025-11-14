import requests
import json

# Test the audit logs endpoint
url = "http://localhost:8000/api/admin/audit-logs"
params = {
    "page": 1,
    "page_size": 15
}

# You'll need to add your auth token here
headers = {
    "Content-Type": "application/json"
}

try:
    response = requests.get(url, params=params, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"\nResponse:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")

# Test stats endpoint
print("\n\n=== Testing Stats Endpoint ===")
stats_url = "http://localhost:8000/api/admin/audit-logs/stats"
try:
    response = requests.get(stats_url, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"\nResponse:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
