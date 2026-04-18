import requests

try:
    # Test overview
    res = requests.get("http://localhost:5001/api/student/dashboard-overview/2")
    print("Overview Status:", res.status_code)
    print("Overview Data:", res.text)
    
    # Test results
    res = requests.get("http://localhost:5001/api/student/results/2")
    print("Results Status:", res.status_code)
    print("Results Data:", res.text)
except Exception as e:
    print("Request failed:", e)
