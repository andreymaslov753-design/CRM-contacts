from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from app.database import get_db
from app.models import User, Contact, ContactTag, Category, TimelineEvent
from app.schemas import (
    ContactCreate, ContactUpdate, ContactOut, ContactListOut,
    TagsAdd, TagOut, CategoryOut
)
from app.auth import get_current_user

router = APIRouter(prefix="/api/contacts", tags=["contacts"])


def _contact_to_list_out(contact: Contact) -> dict:
    """Convert Contact ORM to ContactListOut dict"""
    cat_out = None
    if contact.category:
        cat_out = CategoryOut(
            id=contact.category.id,
            name=contact.category.name,
            color=contact.category.color,
            icon=contact.category.icon,
            sort_order=contact.category.sort_order,
        )
    return {
        "id": contact.id,
        "name": contact.name,
        "phone": contact.phone,
        "email": contact.email,
        "telegram": contact.telegram,
        "company": contact.company,
        "position": contact.position,
        "category_id": contact.category_id,
        "category": cat_out,
        "tags": [TagOut(id=t.id, tag=t.tag) for t in contact.tags],
        "has_photo": bool(contact.photo_base64),
        "created_at": contact.created_at,
    }


def _contact_to_out(contact: Contact) -> dict:
    """Convert Contact ORM to ContactOut dict"""
    cat_out = None
    if contact.category:
        cat_out = CategoryOut(
            id=contact.category.id,
            name=contact.category.name,
            color=contact.category.color,
            icon=contact.category.icon,
            sort_order=contact.category.sort_order,
        )
    return {
        "id": contact.id,
        "name": contact.name,
        "phone": contact.phone,
        "email": contact.email,
        "telegram": contact.telegram,
        "company": contact.company,
        "position": contact.position,
        "notes": contact.notes,
        "photo_base64": contact.photo_base64,
        "category_id": contact.category_id,
        "category": cat_out,
        "tags": [TagOut(id=t.id, tag=t.tag) for t in contact.tags],
        "google_contact_id": contact.google_contact_id,
        "created_at": contact.created_at,
        "updated_at": contact.updated_at,
    }


@router.get("", response_model=List[ContactListOut])
def list_contacts(
    q: Optional[str] = Query(None, description="Search query"),
    category_id: Optional[int] = Query(None),
    tag: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List contacts with optional filtering"""
    query = (
        db.query(Contact)
        .options(joinedload(Contact.tags), joinedload(Contact.category))
        .filter(Contact.user_id == user.id)
    )

    if category_id is not None:
        query = query.filter(Contact.category_id == category_id)

    if tag:
        query = query.join(ContactTag).filter(ContactTag.tag == tag)

    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                Contact.name.ilike(search),
                Contact.company.ilike(search),
                Contact.position.ilike(search),
                Contact.notes.ilike(search),
                Contact.email.ilike(search),
                Contact.phone.ilike(search),
                Contact.telegram.ilike(search),
            )
        )

    query = query.order_by(Contact.name.asc())
    offset = (page - 1) * per_page
    contacts = query.offset(offset).limit(per_page).all()

    return [ContactListOut(**_contact_to_list_out(c)) for c in contacts]


@router.post("", response_model=ContactOut, status_code=201)
def create_contact(
    data: ContactCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new contact"""
    # Verify category belongs to user if specified
    if data.category_id:
        cat = db.query(Category).filter(
            Category.id == data.category_id,
            Category.user_id == user.id,
        ).first()
        if not cat:
            raise HTTPException(status_code=400, detail="Категория не найдена")

    contact = Contact(
        user_id=user.id,
        name=data.name,
        phone=data.phone,
        email=data.email,
        telegram=data.telegram,
        company=data.company,
        position=data.position,
        notes=data.notes,
        photo_base64=data.photo_base64,
        category_id=data.category_id,
    )
    db.add(contact)
    db.flush()

    # Add tags
    if data.tags:
        for tag_text in data.tags:
            tag_clean = tag_text.strip().lstrip("#")
            if tag_clean:
                db.add(ContactTag(contact_id=contact.id, tag=tag_clean))

    # Timeline event
    db.add(TimelineEvent(
        contact_id=contact.id,
        event_type="created",
        description=f"Контакт «{contact.name}» создан",
    ))

    db.commit()
    db.refresh(contact)

    return ContactOut(**_contact_to_out(contact))


@router.get("/{contact_id}", response_model=ContactOut)
def get_contact(
    contact_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single contact"""
    contact = (
        db.query(Contact)
        .options(joinedload(Contact.tags), joinedload(Contact.category))
        .filter(Contact.id == contact_id, Contact.user_id == user.id)
        .first()
    )
    if not contact:
        raise HTTPException(status_code=404, detail="Контакт не найден")

    return ContactOut(**_contact_to_out(contact))


@router.put("/{contact_id}", response_model=ContactOut)
def update_contact(
    contact_id: int,
    data: ContactUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a contact"""
    contact = db.query(Contact).filter(
        Contact.id == contact_id, Contact.user_id == user.id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Контакт не найден")

    if data.category_id is not None:
        cat = db.query(Category).filter(
            Category.id == data.category_id,
            Category.user_id == user.id,
        ).first()
        if not cat:
            raise HTTPException(status_code=400, detail="Категория не найдена")

    update_data = data.model_dump(exclude_unset=True)
    changes = []
    for field, value in update_data.items():
        old_val = getattr(contact, field)
        if old_val != value:
            changes.append(f"{field}: {old_val} → {value}")
            setattr(contact, field, value)

    if changes:
        db.add(TimelineEvent(
            contact_id=contact.id,
            event_type="updated",
            description="Обновлено: " + ", ".join(changes[:3]),
        ))

    db.commit()
    db.refresh(contact)

    return ContactOut(**_contact_to_out(contact))


@router.delete("/{contact_id}", status_code=204)
def delete_contact(
    contact_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a contact"""
    contact = db.query(Contact).filter(
        Contact.id == contact_id, Contact.user_id == user.id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Контакт не найден")

    db.delete(contact)
    db.commit()


# ── Tags ─────────────────────────────────────────────────
@router.post("/{contact_id}/tags", response_model=List[TagOut])
def add_tags(
    contact_id: int,
    data: TagsAdd,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add tags to a contact"""
    contact = db.query(Contact).filter(
        Contact.id == contact_id, Contact.user_id == user.id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Контакт не найден")

    existing_tags = {t.tag for t in contact.tags}
    new_tags = []

    for tag_text in data.tags:
        tag_clean = tag_text.strip().lstrip("#")
        if tag_clean and tag_clean not in existing_tags:
            tag_obj = ContactTag(contact_id=contact.id, tag=tag_clean)
            db.add(tag_obj)
            new_tags.append(tag_clean)
            existing_tags.add(tag_clean)

    if new_tags:
        db.add(TimelineEvent(
            contact_id=contact.id,
            event_type="tags_added",
            description=f"Добавлены теги: {', '.join(new_tags)}",
        ))

    db.commit()
    db.refresh(contact)

    return [TagOut(id=t.id, tag=t.tag) for t in contact.tags]


@router.delete("/{contact_id}/tags/{tag_name}", status_code=204)
def remove_tag(
    contact_id: int,
    tag_name: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a tag from a contact"""
    contact = db.query(Contact).filter(
        Contact.id == contact_id, Contact.user_id == user.id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Контакт не найден")

    tag_obj = db.query(ContactTag).filter(
        ContactTag.contact_id == contact.id,
        ContactTag.tag == tag_name,
    ).first()
    if tag_obj:
        db.delete(tag_obj)
        db.commit()


# ── All tags for user (for tag cloud) ────────────────────
@router.get("/meta/tags", response_model=List[dict])
def get_all_tags(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all unique tags used by the current user with counts"""
    results = (
        db.query(ContactTag.tag, func.count(ContactTag.id).label("count"))
        .join(Contact, ContactTag.contact_id == Contact.id)
        .filter(Contact.user_id == user.id)
        .group_by(ContactTag.tag)
        .order_by(func.count(ContactTag.id).desc())
        .all()
    )
    return [{"tag": r.tag, "count": r.count} for r in results]
