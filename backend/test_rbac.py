import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath("c:\\Users\\munin\\Desktop\\Ai-Invoice\\l\\backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("Testing /foundation/status ...")
    response = client.get("/api/v1/foundation/status")
    assert response.status_code == 200
    
    print("Testing /rbac/admin-only WITHOUT X-User-Role ...")
    response = client.get("/api/v1/rbac/admin-only")
    assert response.status_code == 401
    assert "Missing X-User-Role header" in response.text
    
    print("Testing /rbac/admin-only WITH incorrect role (Client) ...")
    response = client.get("/api/v1/rbac/admin-only", headers={"X-User-Role": "Client"})
    assert response.status_code == 403
    
    print("Testing /rbac/admin-only WITH correct role (System Administrator) ...")
    response = client.get("/api/v1/rbac/admin-only", headers={"X-User-Role": "System Administrator"})
    assert response.status_code == 200
    assert response.json()["user_role"] == "System Administrator"

    print("Testing /rbac/hr-or-admin WITH System Administrator ...")
    response = client.get("/api/v1/rbac/hr-or-admin", headers={"X-User-Role": "System Administrator"})
    assert response.status_code == 200
    
    print("Testing /rbac/hr-or-admin WITH HR Team ...")
    response = client.get("/api/v1/rbac/hr-or-admin", headers={"X-User-Role": "HR Team"})
    assert response.status_code == 200
    
    print("Testing /rbac/hr-or-admin WITH Client ...")
    response = client.get("/api/v1/rbac/hr-or-admin", headers={"X-User-Role": "Client"})
    assert response.status_code == 403
    
    print("Testing /rbac/me WITH Candidate/Employee ...")
    response = client.get("/api/v1/rbac/me", headers={"X-User-Role": "Candidate/Employee"})
    assert response.status_code == 200
    assert response.json()["user_role"] == "Candidate/Employee"
    
    print("All tests passed successfully!")

if __name__ == "__main__":
    run_tests()
