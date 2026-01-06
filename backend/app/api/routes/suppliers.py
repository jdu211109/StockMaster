from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.supplier import Supplier
from app.schemas.supplier import (
    SupplierCreate, SupplierUpdate, SupplierResponse, SupplierListResponse
)
from app.api.deps import CurrentUser, ManagerUser


router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


@router.get("", response_model=SupplierListResponse)
async def get_suppliers(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
):
    """Get all suppliers with pagination and filtering."""
    query = select(Supplier)
    
    if search:
        query = query.where(
            (Supplier.name.ilike(f"%{search}%")) |
            (Supplier.contact_person.ilike(f"%{search}%")) |
            (Supplier.email.ilike(f"%{search}%"))
        )
    
    if is_active is not None:
        query = query.where(Supplier.is_active == is_active)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.order_by(Supplier.name)
    query = query.offset((page - 1) * size).limit(size)
    
    result = await db.execute(query)
    suppliers = result.scalars().all()
    
    return SupplierListResponse(
        items=list(suppliers),
        total=total,
        page=page,
        size=size
    )


@router.get("/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(
    supplier_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
):
    """Get a specific supplier by ID."""
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    return supplier


@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
async def create_supplier(
    supplier_data: SupplierCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: ManagerUser,
):
    """Create a new supplier (Manager/Admin only)."""
    supplier = Supplier(**supplier_data.model_dump())
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)
    
    return supplier


@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: int,
    supplier_data: SupplierUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: ManagerUser,
):
    """Update a supplier (Manager/Admin only)."""
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    update_data = supplier_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(supplier, field, value)
    
    await db.commit()
    await db.refresh(supplier)
    
    return supplier


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_supplier(
    supplier_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: ManagerUser,
):
    """Delete a supplier (Manager/Admin only)."""
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    
    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    
    await db.delete(supplier)
    await db.commit()
