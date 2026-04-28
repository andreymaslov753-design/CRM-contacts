from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Category
from app.schemas import UserRegister, UserLogin, Token
from app.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Default categories created for each new user
DEFAULT_CATEGORIES = [
    {"name": "Бизнес", "color": "#7c3aed", "icon": "💼", "sort_order": 0},
    {"name": "Личное", "color": "#059669", "icon": "👤", "sort_order": 1},
    {"name": "Спорт", "color": "#f59e0b", "icon": "⚽", "sort_order": 2},
    {"name": "Развитие", "color": "#3b82f6", "icon": "📚", "sort_order": 3},
]


@router.post("/register", response_model=Token)
def register(data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        telegram=data.telegram,
    )
    db.add(user)
    db.flush()

    # Create default categories for new user
    for cat_data in DEFAULT_CATEGORIES:
        category = Category(user_id=user.id, **cat_data)
        db.add(category)

    db.commit()
    db.refresh(user)

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token(user.id)
    return Token(access_token=token)


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token(user.id)
    return Token(access_token=token)
