import uuid
import sys
from app.db.session import SessionLocal
from app.services.timesheet_service import approve_timesheet_by_client

def test_approve():
    db = SessionLocal()
    # Just grab any timesheet that is submitted. If none exists, we get 404, but that's fine.
    # Actually, we can just execute it with fake data and catch the traceback if it crashes before 404.
    try:
        approve_timesheet_by_client(
            db=db,
            timesheet_id=uuid.uuid4(),
            client_id=uuid.uuid4(),
            client_email="fake@example.com",
            comments="Test"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_approve()
