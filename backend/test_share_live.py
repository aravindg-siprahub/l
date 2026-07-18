"""
Live test: calls the /share endpoint via the real running server on port 8000.
Captures the full response status + body so we can see any 500 error details.
"""
import urllib.request
import urllib.error
import json
import sys

BASE = "http://localhost:8000/api/v1"

def post(path, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else b""
    req = urllib.request.Request(f"{BASE}{path}", data=body, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.getcode(), json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

def get(path, token=None):
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{BASE}{path}", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.getcode(), json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

# 1. Login
print("=== Step 1: Login ===")
code, resp = post("/auth/login", {"email": "test@example.com", "password": "password123"})
print(f"Status: {code}")
if code != 200:
    print(f"Login failed: {resp}")
    sys.exit(1)
token = resp["access_token"]
print("Login OK, got token")

# 2. Get timesheets
print("\n=== Step 2: Get timesheets ===")
code, timesheets = get("/timesheets/", token=token)
print(f"Status: {code}, count={len(timesheets) if isinstance(timesheets, list) else 'N/A'}")
if not timesheets or not isinstance(timesheets, list):
    print("No timesheets found!")
    sys.exit(1)

# Pick first submitted one (or any)
ts = timesheets[0]
ts_id = ts["id"]
ts_status = ts["status"]
print(f"Using timesheet id={ts_id} status={ts_status}")

# 3. Share
print("\n=== Step 3: POST /share ===")
code, resp = post(f"/timesheets/{ts_id}/share",
                  {"manager_email": "aravindkumar21a@gmail.com", "manager_name": "Aravind Kumar"},
                  token=token)
print(f"Status: {code}")
print(f"Response: {json.dumps(resp, indent=2) if isinstance(resp, dict) else resp}")

if code == 200:
    print("\n✅ SUCCESS — share endpoint returned 200")
else:
    print(f"\n❌ FAILED — got HTTP {code}")
    sys.exit(1)
