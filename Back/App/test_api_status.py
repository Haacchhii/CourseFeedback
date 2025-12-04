import requests
import json

# Test the API endpoint
url = "http://127.0.0.1:8000/api/admin/evaluation-periods"
response = requests.get(url)

print("=== API Response ===")
print(f"Status Code: {response.status_code}")
print("\n=== Response Data ===")
data = response.json()
print(json.dumps(data, indent=2))

if data.get('success') and data.get('data'):
    print("\n=== Period Status Values ===")
    for period in data['data']:
        print(f"ID: {period['id']}, Name: {period['name']}, Status: {repr(period['status'])}")
