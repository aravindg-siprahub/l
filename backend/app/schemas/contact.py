from pydantic import BaseModel, EmailStr, Field
import uuid
from datetime import datetime

class ContactMessageCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    company_name: str | None = Field(None, max_length=255)
    phone: str | None = Field(None, max_length=50)
    subject: str | None = Field(None, max_length=255)
    message: str = Field(..., min_length=10)

class ContactMessageResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    company_name: str | None
    phone: str | None
    subject: str | None
    message: str
    is_read: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
