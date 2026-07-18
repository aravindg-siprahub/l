import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.dependencies import get_db, get_current_user
from app.core.db.models import User, UserRole, Timesheet
from app.schemas.auth import UserOut, UserUpdate, RegisterRequest
from app.core.security import get_password_hash
from app.schemas.timesheet import TimesheetOut, TimesheetSharePayload, TimesheetUpdate
from app.services import timesheet_service

router = APIRouter()


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency to enforce Admin role."""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator access is required to perform this action."
        )
    return current_user

@router.get("/users", response_model=list[UserOut])
def get_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Retrieve all users."""
    stmt = select(User).order_by(User.full_name)
    return list(db.scalars(stmt).all())

@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new user (Admin only)."""
    # Check if email exists
    existing_user = db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        is_active=True,
        is_verified=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: uuid.UUID,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a user (Admin only)."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if payload.full_name is not None:
        user.full_name = payload.full_name
    if payload.role is not None:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.password:
        user.hashed_password = get_password_hash(payload.password)
        
    db.commit()
    db.refresh(user)
    return user



@router.get("/candidates", response_model=list[UserOut])
def get_candidates(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Retrieve all candidates."""
    stmt = select(User).where(User.role == UserRole.candidate).order_by(User.full_name)
    return list(db.scalars(stmt).all())


@router.get("/candidates/{candidate_id}/timesheets", response_model=list[TimesheetOut])
def get_candidate_timesheets(
    candidate_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Retrieve all timesheets for a specific candidate."""
    candidate = db.get(User, candidate_id)
    if not candidate or candidate.role != UserRole.candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")
    return timesheet_service.get_timesheets_for_candidate(db, candidate_id)


@router.get("/timesheets/{timesheet_id}", response_model=TimesheetOut)
def get_timesheet(
    timesheet_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Retrieve a specific timesheet by ID."""
    ts = db.get(Timesheet, timesheet_id)
    if not ts:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found.")
    # Delegate to service with the actual candidate's ID to pass ownership check
    return timesheet_service.get_timesheet_by_id(db, timesheet_id, ts.candidate_id)


@router.put("/timesheets/{timesheet_id}", response_model=TimesheetOut)
def update_timesheet(
    timesheet_id: uuid.UUID,
    payload: TimesheetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a timesheet on behalf of the candidate."""
    ts = db.get(Timesheet, timesheet_id)
    if not ts:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found.")
    return timesheet_service.update_timesheet(db, timesheet_id, payload, ts.candidate_id)


@router.post("/timesheets/{timesheet_id}/submit", response_model=TimesheetOut)
def submit_timesheet(
    timesheet_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Submit a timesheet on behalf of the candidate."""
    ts = db.get(Timesheet, timesheet_id)
    if not ts:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found.")
    return timesheet_service.submit_timesheet(db, timesheet_id, ts.candidate_id)


@router.post("/timesheets/{timesheet_id}/share", response_model=TimesheetOut)
def share_timesheet(
    timesheet_id: uuid.UUID,
    payload: TimesheetSharePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Share a timesheet on behalf of the candidate."""
    ts = db.get(Timesheet, timesheet_id)
    if not ts:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found.")
    return timesheet_service.share_timesheet_with_manager(
        db, timesheet_id, ts.candidate_id, payload, ts.candidate.full_name
    )


@router.get("/timesheets/{timesheet_id}/pdf")
def download_timesheet_pdf(
    timesheet_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Download the PDF for a timesheet."""
    ts = db.get(Timesheet, timesheet_id)
    if not ts:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found.")
    pdf_bytes, filename = timesheet_service.get_timesheet_pdf_bytes(
        db, timesheet_id, ts.candidate_id, ts.candidate.full_name
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/timesheets/{timesheet_id}/excel")
def download_timesheet_excel(
    timesheet_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Download the Excel file for a timesheet."""
    ts = db.get(Timesheet, timesheet_id)
    if not ts:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timesheet not found.")
    excel_bytes, filename = timesheet_service.get_timesheet_excel_bytes(
        db, timesheet_id, ts.candidate_id, ts.candidate.full_name
    )
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
