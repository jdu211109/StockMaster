from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.category import Category
from app.schemas.category import (
    CategoryCreate, CategoryUpdate, CategoryResponse, CategoryListResponse
)
from app.api.deps import CurrentUser, ManagerUser


router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=CategoryListResponse)
async def get_categories(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
    parent_id: Optional[int] = Query(None, description="Filter by parent category"),
):
    """Get all categories."""
    query = select(Category)
    if parent_id is not None:
        query = query.where(Category.parent_id == parent_id)
    else:
        query = query.where(Category.parent_id.is_(None))  # Root categories
    
    result = await db.execute(query.order_by(Category.name))
    categories = result.scalars().all()
    
    # Get total count
    count_result = await db.execute(select(func.count(Category.id)))
    total = count_result.scalar()
    
    return CategoryListResponse(items=list(categories), total=total)


@router.get("/all", response_model=CategoryListResponse)
async def get_all_categories(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
):
    """Get all categories (flat list)."""
    result = await db.execute(select(Category).order_by(Category.name))
    categories = result.scalars().all()
    
    return CategoryListResponse(items=list(categories), total=len(categories))


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
):
    """Get a specific category by ID."""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    return category


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CategoryCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: ManagerUser,
):
    """Create a new category (Manager/Admin only)."""
    # Validate parent exists if provided
    if category_data.parent_id:
        result = await db.execute(
            select(Category).where(Category.id == category_data.parent_id)
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent category not found"
            )
    
    category = Category(**category_data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: ManagerUser,
):
    """Update a category (Manager/Admin only)."""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    # Prevent circular reference
    if category_data.parent_id == category_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category cannot be its own parent"
        )
    
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    await db.commit()
    await db.refresh(category)
    
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: ManagerUser,
):
    """Delete a category (Manager/Admin only)."""
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    
    await db.delete(category)
    await db.commit()
