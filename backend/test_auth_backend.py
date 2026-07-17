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
from sqlalchemy.exc import IntegrityError

from app.core.config import settings
from app.infrastructure.database.session import engine, AsyncSessionFactory
from app.core.models.user import User
from app.core.security.roles import Role
from app.core.db.base import Base

from app.main import app

client = TestClient(app)
SECRET = settings.SUPABASE_JWT_SECRET

def create_jwt(secret=SECRET, expires_delta=timedelta(hours=1), sub=None, aud="authenticated"):
    payload = {
        "sub": sub,
        "aud": aud,
        "exp": datetime.now(timezone.utc) + expires_delta,
        "role": "authenticated"
    }
    return jwt.encode(payload, secret, algorithm="HS256")

async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionFactory() as session:
        result = await session.execute(select(User).where(User.email == "test_auth@example.com"))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            print(f"User already exists, using existing ID: {existing_user.id}")
            return str(existing_user.id)
            
        user_id = str(uuid.uuid4())
        user = User(
            id=uuid.UUID(user_id),
            email="test_auth@example.com",
            role=Role.SYSTEM_ADMINISTRATOR,
            full_name="Test Auth User",
            is_deleted=False
        )
        session.add(user)
        await session.commit()
        print(f"Created test user in DB with ID: {user_id}")
        return user_id

async def run_tests():
    user_id = await setup_db()

    print("\n1. Testing with NO JWT ...")
    response = client.get("/api/v1/rbac/me")
    assert response.status_code == 401
    print("OK Passed (Missing JWT -> 401)")

    print("\n2. Testing with INVALID Signature ...")
    invalid_token = create_jwt(secret="wrong-secret", sub=user_id)
    response = client.get("/api/v1/rbac/me", headers={"Authorization": f"Bearer {invalid_token}"})
    assert response.status_code == 401
    print("OK Passed (Invalid Signature -> 401)")

    print("\n3. Testing with EXPIRED JWT ...")
    expired_token = create_jwt(expires_delta=timedelta(hours=-1), sub=user_id)
    response = client.get("/api/v1/rbac/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert response.status_code == 401
    print("OK Passed (Expired JWT -> 401)")

    print("\n4. Testing with VALID JWT ...")
    valid_token = create_jwt(sub=user_id)
    response = client.get("/api/v1/rbac/me", headers={"Authorization": f"Bearer {valid_token}"})
    assert response.status_code == 200
    assert response.json()["user_role"] == "System Administrator"
    print("OK Passed (Valid JWT -> 200 and loaded user)")
    
    print("\nAll tests passed successfully!")

if __name__ == "__main__":
    asyncio.run(run_tests())
