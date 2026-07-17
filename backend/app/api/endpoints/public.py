from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.infrastructure.database.session import get_db
from app.schemas.contact import ContactMessageCreate, ContactMessageResponse
from app.core.db.models import ContactMessage
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/contact", response_model=ContactMessageResponse, status_code=status.HTTP_201_CREATED)
def submit_contact_message(
    message: ContactMessageCreate, 
    db: Session = Depends(get_db)
):
    """
    Submit a contact inquiry from the public landing page.
    """
    logger.info(f"Received contact submission from {message.email}")
    
    db_message = ContactMessage(
        name=message.name,
        email=message.email,
        company_name=message.company_name,
        phone=message.phone,
        subject=message.subject,
        message=message.message
    )
    
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return db_message
