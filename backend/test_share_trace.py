"""
In-process test using FastAPI TestClient — captures full server traceback.
"""
import sys
import traceback
import io
import logging
import json

# Capture all logging output  
log_capture = io.StringIO()
handler = logging.StreamHandler(log_capture)
handler.setLevel(logging.DEBUG)
logging.getLogger().addHandler(handler)

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app, raise_server_exceptions=False)

# 1. Login
print("=== Login ===")
r = client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "password123"})
assert r.status_code == 200, f"Login failed: {r.text}"
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}
print("OK")

# 2. Get timesheets
print("=== Get timesheets ===")
r = client.get("/api/v1/timesheets/", headers=headers)
tss = r.json()
ts = next((t for t in tss if t["status"] == "submitted"), tss[0] if tss else None)
assert ts, "No timesheet found"
ts_id = ts["id"]
print(f"Using timesheet {ts_id} (status={ts['status']})")

# 3. Share — capture all output
print("=== POST /share ===")
r = client.post(
    f"/api/v1/timesheets/{ts_id}/share",
    json={"manager_email": "aravindkumar21a@gmail.com", "manager_name": "Aravind Kumar"},
    headers=headers,
)
print(f"HTTP Status: {r.status_code}")
print(f"Response body: {r.text}")

# Print captured logs which will include the exception
print("\n=== Captured server logs ===")
log_contents = log_capture.getvalue()
print(log_contents if log_contents else "(no logs captured)")
