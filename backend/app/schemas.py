from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    telegram: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Category ─────────────────────────────────────────
class CategoryCreate(BaseModel):
    name: str
    color: str = "#7c3aed"
    icon: str = "📁"


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    sort_order: Optional[int] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    color: str
    icon: str
    sort_order: int
    contacts_count: int = 0

    class Config:
        from_attributes = True


# ── Tags ─────────────────────────────────────────────
class TagOut(BaseModel):
    id: int
    tag: str

    class Config:
        from_attributes = True


class TagsAdd(BaseModel):
    tags: List[str]


# ── Contact ──────────────────────────────────────────
class ContactCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    telegram: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    notes: Optional[str] = None
    photo_base64: Optional[str] = None
    category_id: Optional[int] = None
    tags: Optional[List[str]] = []


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    telegram: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    notes: Optional[str] = None
    photo_base64: Optional[str] = None
    category_id: Optional[int] = None


class ContactOut(BaseModel):
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    telegram: Optional[str]
    company: Optional[str]
    position: Optional[str]
    notes: Optional[str]
    photo_base64: Optional[str]
    category_id: Optional[int]
    category: Optional[CategoryOut] = None
    tags: List[TagOut] = []
    google_contact_id: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ContactListOut(BaseModel):
    """Lighter version for lists — no photo_base64"""
    id: int
    name: str
    phone: Optional[str]
    email: Optional[str]
    telegram: Optional[str]
    company: Optional[str]
    position: Optional[str]
    category_id: Optional[int]
    category: Optional[CategoryOut] = None
    tags: List[TagOut] = []
    has_photo: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


# ── Reminder ─────────────────────────────────────────
class ReminderCreate(BaseModel):
    remind_at: datetime
    text: str


class ReminderUpdate(BaseModel):
    remind_at: Optional[datetime] = None
    text: Optional[str] = None


class ReminderOut(BaseModel):
    id: int
    contact_id: int
    contact_name: str = ""
    remind_at: datetime
    text: str
    is_done: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ── Timeline ─────────────────────────────────────────
class TimelineEventOut(BaseModel):
    id: int
    event_type: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Google Sync ──────────────────────────────────────
class GoogleSyncReceive(BaseModel):
    """Payload from n8n with Google Contacts data"""
    user_id: int
    contacts: List[dict]


# ── Search ───────────────────────────────────────────
class SearchQuery(BaseModel):
    q: str = ""
    category_id: Optional[int] = None
    tag: Optional[str] = None
    page: int = 1
    per_page: int = 50
