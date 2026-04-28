from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Contact, TimelineEvent
from app.schemas import TimelineEventOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/contacts", tags=["timeline"])


@router.get("/{contact_id}/timeline", response_model=List[TimelineEventOut])
def get_timeline(
    contact_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = db.query(Contact).filter(
        Contact.id == contact_id, Contact.user_id == user.id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Контакт не найден")

    events = (
        db.query(TimelineEvent)
        .filter(TimelineEvent.contact_id == contact.id)
        .order_by(TimelineEvent.created_at.desc())
        .limit(100)
        .all()
    )
    return [TimelineEventOut(
        id=e.id, event_type=e.event_type,
        description=e.description, created_at=e.created_at,
    ) for e in events]
