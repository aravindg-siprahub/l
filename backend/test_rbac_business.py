import sys
import os
import uuid
import jwt
from datetime import datetime, timedelta, timezone
import asyncio

sys.path.insert(0, os.path.abspath("c:\\Users\\munin\\Desktop\\Ai-Invoice\\l\\backend"))

from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.infrastructure.database.session import engine, AsyncSessionFactory
from app.core.models.user import User
from app.core.security.roles import Role
from app.core.db.base import Base

from app.main import app

client = TestClient(app)
SECRET = settings.SUPABASE_JWT_SECRET

def create_jwt(sub, role: Role):
    payload = {
        "sub": str(sub),
        "aud": "authenticated",
        "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        "role": role.value
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")

async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    users = {}
    async with AsyncSessionFactory() as session:
        for role in Role:
            # We use deterministic emails for test users
            email = f"test_{role.name.lower()}@example.com"
            result = await session.execute(select(User).where(User.email == email))
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                users[role] = str(existing_user.id)
            else:
                user_id = uuid.uuid4()
                user = User(
                    id=user_id,
                    email=email,
                    role=role,
                    full_name=f"Test {role.value}",
                    is_deleted=False
                )
                session.add(user)
                users[role] = str(user_id)
        
        await session.commit()
    return users

async def run_tests():
    users = await setup_db()

    print("\n--- Testing System Administrator endpoints ---")
    admin_token = create_jwt(users[Role.SYSTEM_ADMINISTRATOR], Role.SYSTEM_ADMINISTRATOR)
    assert client.get("/api/v1/system/users", headers={"Authorization": f"Bearer {admin_token}"}).status_code == 200
    
    # Try unauthorized role on admin endpoint
    employee_token = create_jwt(users[Role.CANDIDATE_EMPLOYEE], Role.CANDIDATE_EMPLOYEE)
    assert client.get("/api/v1/system/users", headers={"Authorization": f"Bearer {employee_token}"}).status_code == 403
    print("OK System Administrator RBAC verified")

    print("\n--- Testing Timesheet endpoints ---")
    assert client.get("/api/v1/timesheets/me", headers={"Authorization": f"Bearer {employee_token}"}).status_code == 200
    
    # Try admin on employee endpoint
    assert client.get("/api/v1/timesheets/me", headers={"Authorization": f"Bearer {admin_token}"}).status_code == 403

    client_manager_token = create_jwt(users[Role.CLIENT_MANAGER], Role.CLIENT_MANAGER)
    assert client.get("/api/v1/timesheets/assigned", headers={"Authorization": f"Bearer {client_manager_token}"}).status_code == 200
    # Try employee on client manager endpoint
    assert client.get("/api/v1/timesheets/assigned", headers={"Authorization": f"Bearer {employee_token}"}).status_code == 403
    print("OK Timesheets RBAC verified")

    print("\n--- Testing HR endpoints ---")
    hr_token = create_jwt(users[Role.HR_TEAM], Role.HR_TEAM)
    assert client.post("/api/v1/hr/allocations/validate", headers={"Authorization": f"Bearer {hr_token}"}).status_code == 200
    # Try client on HR endpoint
    client_token = create_jwt(users[Role.CLIENT], Role.CLIENT)
    assert client.post("/api/v1/hr/allocations/validate", headers={"Authorization": f"Bearer {client_token}"}).status_code == 403
    print("OK HR RBAC verified")

    print("\n--- Testing Invoices endpoints ---")
    accounts_token = create_jwt(users[Role.ACCOUNTS_TEAM], Role.ACCOUNTS_TEAM)
    assert client.get("/api/v1/invoices", headers={"Authorization": f"Bearer {accounts_token}"}).status_code == 200
    assert client.get("/api/v1/invoices", headers={"Authorization": f"Bearer {client_token}"}).status_code == 200
    
    # Try employee on invoices endpoint
    assert client.get("/api/v1/invoices", headers={"Authorization": f"Bearer {employee_token}"}).status_code == 403
    
    # Client can see notifications, Accounts cannot edit? Wait, check billing/validate
    assert client.post("/api/v1/invoices/billing/validate", headers={"Authorization": f"Bearer {accounts_token}"}).status_code == 200
    assert client.post("/api/v1/invoices/billing/validate", headers={"Authorization": f"Bearer {client_token}"}).status_code == 403
    print("OK Invoices RBAC verified")
    
    print("\n--- Testing Authentication layers ---")
    assert client.get("/api/v1/system/users").status_code == 401
    assert client.get("/api/v1/system/users", headers={"Authorization": "Bearer invalid"}).status_code == 401
    print("OK Missing/Invalid JWT verified")

    print("\nAll RBAC tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(run_tests())
