import os
import uuid
import time
import httpx
from datetime import date
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

# Setup minimal DB connection using existing .env
from app.core.config import settings
from app.core.db.models import User, Timesheet, TimesheetStatus
from app.core.security import create_access_token

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_test_data(db):
    # Get or create candidate
    candidate = db.scalar(select(User).where(User.email == "candidate_e2e@example.com"))
    if not candidate:
        candidate = User(id=uuid.uuid4(), email="candidate_e2e@example.com", full_name="Test Candidate", role="candidate", hashed_password="fake")
        db.add(candidate)
    
    # Get or create manager
    manager = db.scalar(select(User).where(User.email == "manager_e2e@example.com"))
    if not manager:
        manager = User(id=uuid.uuid4(), email="manager_e2e@example.com", full_name="Test Manager", role="client_manager", hashed_password="fake")
        db.add(manager)
    
    db.commit()

    # Create two submitted timesheets
    ts_reject = Timesheet(
        id=uuid.uuid4(),
        candidate_id=candidate.id,
        manager_email=manager.email,
        manager_name=manager.full_name,
        period_start_date=date.today(),
        period_end_date=date.today(),
        status=TimesheetStatus.submitted,
        total_hours=8.0
    )
    
    ts_approve = Timesheet(
        id=uuid.uuid4(),
        candidate_id=candidate.id,
        manager_email=manager.email,
        manager_name=manager.full_name,
        period_start_date=date.today(),
        period_end_date=date.today(),
        status=TimesheetStatus.submitted,
        total_hours=8.0
    )
    
    db.add_all([ts_reject, ts_approve])
    db.commit()
    
    return ts_reject.id, ts_approve.id, manager.id

def test_endpoints():
    db = SessionLocal()
    ts_reject_id, ts_approve_id, manager_id = create_test_data(db)
    
    # Generate auth cookie for manager
    token = create_access_token(data={"sub": str(manager_id)})
    cookies = {"access_token": token}
    
    print("Testing REJECT flow (expected: 200, candidate email sent)...")
    res_reject = httpx.post(
        f"http://localhost:8000/api/v1/timesheets/{ts_reject_id}/client-reject",
        json={"reason": "Test rejection reason"},
        cookies=cookies,
        timeout=10.0
    )
    print(f"Reject Status: {res_reject.status_code}")
    if res_reject.status_code != 200:
        print(f"Reject Body: {res_reject.text}")
        
    print("\nTesting APPROVE flow (expected: 200, finance email log warning)...")
    res_approve = httpx.post(
        f"http://localhost:8000/api/v1/timesheets/{ts_approve_id}/client-approve",
        json={"comments": "Looks good"},
        cookies=cookies,
        timeout=10.0
    )
    print(f"Approve Status: {res_approve.status_code}")
    if res_approve.status_code != 200:
        print(f"Approve Body: {res_approve.text}")

if __name__ == "__main__":
    test_endpoints()
