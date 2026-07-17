import urllib.request
import json
import traceback

data = json.dumps({
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "candidate"
}).encode("utf-8")

req = urllib.request.Request("http://localhost:8000/api/v1/auth/register", data=data)
req.add_header("Content-Type", "application/json")

try:
    with urllib.request.urlopen(req) as f:
        print("Response Code:", f.getcode())
        print("Response Body:", f.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Error Body:", e.read().decode("utf-8"))
except Exception as e:
    print("Exception:", str(e))
    traceback.print_exc()
