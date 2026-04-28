from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import User, Contact, Reminder
from app.schemas import ReminderCreate, ReminderUpdate, ReminderOut
from app.auth import get_current_user

router = APIRouter(prefix="/api", tags=["reminders"])


def _reminder_to_out(r: Reminder) -> ReminderOut:
    return ReminderOut(
        id=r.id,
        contact_id=r.contact_id,
        contact_name=r.contact.name if r.contact else "",
        remind_at=r.remind_at,
        text=r.text,
        is_done=r.is_done,
        created_at=r.created_at,
    )


@router.get("/reminders", response_model=List[ReminderOut])
def list_reminders(
    filter: Optional[str] = Query(None, description="upcoming, overdue, done"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all reminders for the current user"""
    query = (
        db.query(Reminder)
        .options(joinedload(Reminder.contact))
        .filter(Reminder.user_id == user.id)
    )

    now = datetime.now(timezone.utc)

    if filter == "upcoming":
        query = query.filter(Reminder.is_done == False, Reminder.remind_at >= now)
    elif filter == "overdue":
        query = query.filter(Reminder.is_done == False, Reminder.remind_at < now)
    elif filter == "done":
        query = query.filter(Reminder.is_done == True)
    else:
        query = query.filter(Reminder.is_done == False)

    reminders = query.order_by(Reminder.remind_at.asc()).all()
    return [_reminder_to_out(r) for r in reminders]


@router.post("/contacts/{contact_id}/reminders", response_model=ReminderOut, status_code=201)
def create_reminder(
    contact_id: int,
    data: ReminderCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a reminder for a contact"""
    contact = db.query(Contact).filter(
        Contact.id == contact_id, Contact.user_id == user.id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Контакт не найден")

    reminder = Reminder(
        contact_id=contact.id,
        user_id=user.id,
        remind_at=data.remind_at,
        text=data.text,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)

    return _reminder_to_out(reminder)


@router.put("/reminders/{reminder_id}", response_model=ReminderOut)
def update_reminder(
    reminder_id: int,
    data: ReminderUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a reminder"""
    reminder = (
        db.query(Reminder)
        .options(joinedload(Reminder.contact))
        .filter(Reminder.id == reminder_id, Reminder.user_id == user.id)
        .first()
    )
    if not reminder:
        raise HTTPException(status_code=404, detail="Напоминание не найдено")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reminder, field, value)

    db.commit()
    db.refresh(reminder)

    return _reminder_to_out(reminder)


@router.patch("/reminders/{reminder_id}/done", response_model=ReminderOut)
def mark_done(
    reminder_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a reminder as done"""
    reminder = (
        db.query(Reminder)
        .options(joinedload(Reminder.contact))
        .filter(Reminder.id == reminder_id, Reminder.user_id == user.id)
        .first()
    )
    if not reminder:
        raise HTTPException(status_code=404, detail="Напоминание не найдено")

    reminder.is_done = True
    db.commit()
    db.refresh(reminder)

    return _reminder_to_out(reminder)


@router.delete("/reminders/{reminder_id}", status_code=204)
def delete_reminder(
    reminder_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a reminder"""
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id, Reminder.user_id == user.id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Напоминание не найдено")

    db.delete(reminder)
    db.commit()
