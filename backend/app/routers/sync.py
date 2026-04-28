"""Google Contacts sync via n8n"""
import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Contact, ContactTag, Category, TimelineEvent
from app.schemas import GoogleSyncReceive
from app.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/api/sync", tags=["sync"])


@router.post("/google/trigger")
async def trigger_google_sync(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Trigger n8n to fetch Google Contacts for this user"""
    webhook_url = settings.N8N_GOOGLE_SYNC_WEBHOOK_URL
    if not webhook_url:
        raise HTTPException(status_code=503, detail="Google sync не настроен")

    callback_url = f"{settings.BACKEND_URL}/api/sync/google/receive"
    payload = {"user_id": user.id, "callback_url": callback_url}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(webhook_url, json=payload)
            resp.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Ошибка n8n: {str(e)}")

    return {"status": "sync_triggered"}


@router.post("/google/receive")
def receive_google_contacts(
    data: GoogleSyncReceive,
    db: Session = Depends(get_db),
):
    """Receive contacts from n8n after Google sync"""
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Find or create "Google" category
    google_cat = db.query(Category).filter(
        Category.user_id == user.id, Category.name == "Google"
    ).first()
    if not google_cat:
        google_cat = Category(
            user_id=user.id, name="Google",
            color="#4285F4", icon="🔵", sort_order=99,
        )
        db.add(google_cat)
        db.flush()

    created, updated = 0, 0
    for c in data.contacts:
        gid = c.get("google_contact_id", "")
        if not gid:
            continue

        existing = db.query(Contact).filter(
            Contact.user_id == user.id, Contact.google_contact_id == gid
        ).first()

        if existing:
            for field in ["name", "phone", "email", "company", "position", "notes"]:
                if c.get(field):
                    setattr(existing, field, c[field])
            updated += 1
        else:
            contact = Contact(
                user_id=user.id, category_id=google_cat.id,
                name=c.get("name", "Без имени"),
                phone=c.get("phone"), email=c.get("email"),
                company=c.get("company"), position=c.get("position"),
                notes=c.get("notes"), google_contact_id=gid,
                telegram=c.get("telegram"),
            )
            db.add(contact)
            db.flush()

            db.add(TimelineEvent(
                contact_id=contact.id, event_type="synced",
                description="Синхронизирован из Google Contacts",
            ))
            created += 1

    db.commit()
    return {"created": created, "updated": updated}
