from sqlalchemy import (
    Column, Integer, BigInteger, String, Text, Float,
    ForeignKey, DateTime, Boolean, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from app.database import Base


# ── User ─────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    telegram = Column(String(100), nullable=True)
    telegram_id = Column(BigInteger, unique=True, nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    contacts = relationship("Contact", back_populates="owner", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="owner", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="owner", cascade="all, delete-orphan")


# ── Category ─────────────────────────────────────────────
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    color = Column(String(20), default="#7c3aed")
    icon = Column(String(10), default="📁")
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="categories")
    contacts = relationship("Contact", back_populates="category")

    __table_args__ = (
        Index("ix_categories_user_id", "user_id"),
    )


# ── Contact ──────────────────────────────────────────────
class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)

    name = Column(String(300), nullable=False)
    phone = Column(String(50), nullable=True)
    email = Column(String(200), nullable=True)
    telegram = Column(String(100), nullable=True)
    company = Column(String(200), nullable=True)
    position = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    photo_base64 = Column(Text, nullable=True)

    # Google Contacts sync
    google_contact_id = Column(String(100), nullable=True, index=True)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="contacts")
    category = relationship("Category", back_populates="contacts")
    tags = relationship("ContactTag", back_populates="contact", cascade="all, delete-orphan")
    reminders = relationship("Reminder", back_populates="contact", cascade="all, delete-orphan")
    audio_notes = relationship("AudioNote", back_populates="contact", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="contact", cascade="all, delete-orphan")
    timeline_events = relationship("TimelineEvent", back_populates="contact", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_contacts_user_id", "user_id"),
        Index("ix_contacts_name", "name"),
    )


# ── Tags ─────────────────────────────────────────────────
class ContactTag(Base):
    __tablename__ = "contact_tags"

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False)
    tag = Column(String(100), nullable=False)

    contact = relationship("Contact", back_populates="tags")

    __table_args__ = (
        Index("ix_contact_tags_contact_id", "contact_id"),
        Index("ix_contact_tags_tag", "tag"),
    )


# ── Reminders ────────────────────────────────────────────
class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    remind_at = Column(DateTime(timezone=True), nullable=False)
    text = Column(String(500), nullable=False)
    is_done = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    contact = relationship("Contact", back_populates="reminders")
    owner = relationship("User", back_populates="reminders")

    __table_args__ = (
        Index("ix_reminders_user_id", "user_id"),
        Index("ix_reminders_remind_at", "remind_at"),
    )


# ── Audio Notes ──────────────────────────────────────────
class AudioNote(Base):
    __tablename__ = "audio_notes"

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False)
    audio_base64 = Column(Text, nullable=False)
    duration_seconds = Column(Integer, nullable=True)
    mime_type = Column(String(50), default="audio/webm")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    contact = relationship("Contact", back_populates="audio_notes")


# ── Attachments ──────────────────────────────────────────
class Attachment(Base):
    __tablename__ = "attachments"

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(300), nullable=False)
    mime_type = Column(String(100), nullable=True)
    file_base64 = Column(Text, nullable=False)
    file_size = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    contact = relationship("Contact", back_populates="attachments")


# ── Timeline Events ──────────────────────────────────────
class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contacts.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(50), nullable=False)  # created, updated, synced, file_added, reminder_set
    description = Column(String(500), nullable=True)
    metadata_json = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    contact = relationship("Contact", back_populates="timeline_events")

    __table_args__ = (
        Index("ix_timeline_contact_id", "contact_id"),
    )
