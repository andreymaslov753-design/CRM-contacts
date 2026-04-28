from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, Category, Contact
from app.schemas import CategoryCreate, CategoryUpdate, CategoryOut
from app.auth import get_current_user

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=List[CategoryOut])
def list_categories(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all categories for the current user"""
    categories = (
        db.query(Category)
        .filter(Category.user_id == user.id)
        .order_by(Category.sort_order.asc())
        .all()
    )

    result = []
    for cat in categories:
        count = db.query(func.count(Contact.id)).filter(
            Contact.category_id == cat.id
        ).scalar()
        result.append(CategoryOut(
            id=cat.id,
            name=cat.name,
            color=cat.color,
            icon=cat.icon,
            sort_order=cat.sort_order,
            contacts_count=count or 0,
        ))
    return result


@router.post("", response_model=CategoryOut, status_code=201)
def create_category(
    data: CategoryCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new category"""
    max_order = (
        db.query(func.max(Category.sort_order))
        .filter(Category.user_id == user.id)
        .scalar() or 0
    )

    category = Category(
        user_id=user.id,
        name=data.name,
        color=data.color,
        icon=data.icon,
        sort_order=max_order + 1,
    )
    db.add(category)
    db.commit()
    db.refresh(category)

    return CategoryOut(
        id=category.id,
        name=category.name,
        color=category.color,
        icon=category.icon,
        sort_order=category.sort_order,
        contacts_count=0,
    )


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    data: CategoryUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a category"""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == user.id,
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)

    count = db.query(func.count(Contact.id)).filter(
        Contact.category_id == category.id
    ).scalar()

    return CategoryOut(
        id=category.id,
        name=category.name,
        color=category.color,
        icon=category.icon,
        sort_order=category.sort_order,
        contacts_count=count or 0,
    )


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a category (contacts become uncategorized)"""
    category = db.query(Category).filter(
        Category.id == category_id,
        Category.user_id == user.id,
    ).first()
    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")

    # Set contacts to uncategorized
    db.query(Contact).filter(Contact.category_id == category.id).update(
        {"category_id": None}
    )

    db.delete(category)
    db.commit()
