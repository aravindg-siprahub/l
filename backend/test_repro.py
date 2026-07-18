from fastapi.testclient import TestClient
from app.main import app
from app.api.dependencies import require_client_manager
from app.core.db.models import User
import uuid

# Mock the dependency to return a fake client manager
async def mock_require_client_manager():
    user = User(id=uuid.uuid4(), email="manager@example.com", full_name="Test Manager", role="client_manager")
    return user

app.dependency_overrides[require_client_manager] = mock_require_client_manager

client = TestClient(app)

def run():
    # Pick ANY uuid for timesheet, doesn't matter if it fails with 404, we want to see if it throws 500
    # Actually, we need a REAL timesheet ID that is in "submitted" status, OR we can just let it fail with 404!
    # Wait, if it fails with 500 BEFORE hitting 404, we catch the 500!
    # If the 500 happens inside the approve logic AFTER fetching the timesheet, we need a real timesheet.
    # Let's hit the endpoint with a fake UUID and see if it fails with 500 or 404.
    fake_id = str(uuid.uuid4())
    print("Testing client-approve endpoint...")
    try:
        response = client.post(f"/api/v1/timesheets/{fake_id}/client-approve", json={"comments": "test"})
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run()
