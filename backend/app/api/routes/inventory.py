from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.location import Location
from app.schemas.inventory import (
    InventoryCreate, InventoryUpdate, InventoryResponse, 
    InventoryListResponse, LowStockAlert, LowStockAlertList
)
from app.api.deps import CurrentUser, ManagerUser


router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("", response_model=InventoryListResponse)
async def get_inventory(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    product_id: Optional[int] = None,
    location_id: Optional[int] = None,
    low_stock_only: bool = False,
):
    """Get inventory items with pagination and filtering."""
    query = select(Inventory).options(
        selectinload(Inventory.product),
        selectinload(Inventory.location)
    )
    
    if product_id:
        query = query.where(Inventory.product_id == product_id)
    if location_id:
        query = query.where(Inventory.location_id == location_id)
    if low_stock_only:
        query = query.where(Inventory.quantity <= Inventory.reorder_level)
    
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()
    
    query = query.order_by(Inventory.last_updated.desc())
    query = query.offset((page - 1) * size).limit(size)
    
    result = await db.execute(query)
    items = [
        InventoryResponse(
            id=inv.id, product_id=inv.product_id, location_id=inv.location_id,
            quantity=inv.quantity, reorder_level=inv.reorder_level,
            reorder_quantity=inv.reorder_quantity, last_updated=inv.last_updated,
            product_name=inv.product.name if inv.product else None,
            product_sku=inv.product.sku if inv.product else None,
            location_name=inv.location.name if inv.location else None,
            is_low_stock=inv.quantity <= inv.reorder_level
        ) for inv in result.scalars().all()
    ]
    
    return InventoryListResponse(items=items, total=total, page=page, size=size)


@router.get("/low-stock", response_model=LowStockAlertList)
async def get_low_stock_alerts(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
):
    """Get all low stock alerts."""
    query = select(Inventory).options(
        selectinload(Inventory.product), selectinload(Inventory.location)
    ).where(Inventory.quantity <= Inventory.reorder_level)
    
    result = await db.execute(query.order_by(Inventory.quantity))
    alerts = [
        LowStockAlert(
            product_id=inv.product_id,
            product_name=inv.product.name if inv.product else "Unknown",
            product_sku=inv.product.sku if inv.product else "Unknown",
            location_id=inv.location_id,
            location_name=inv.location.name if inv.location else "Unknown",
            current_quantity=inv.quantity,
            reorder_level=inv.reorder_level,
            reorder_quantity=inv.reorder_quantity
        ) for inv in result.scalars().all()
    ]
    return LowStockAlertList(items=alerts, total=len(alerts))


@router.post("", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
async def create_inventory(
    data: InventoryCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: ManagerUser,
):
    """Create a new inventory record."""
    product = (await db.execute(select(Product).where(Product.id == data.product_id))).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=400, detail="Product not found")
    
    location = (await db.execute(select(Location).where(Location.id == data.location_id))).scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=400, detail="Location not found")
    
    existing = (await db.execute(
        select(Inventory).where(
            (Inventory.product_id == data.product_id) & (Inventory.location_id == data.location_id)
        )
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Inventory already exists for this product-location")
    
    inventory = Inventory(**data.model_dump())
    db.add(inventory)
    await db.commit()
    await db.refresh(inventory)
    
    return InventoryResponse(
        id=inventory.id, product_id=inventory.product_id, location_id=inventory.location_id,
        quantity=inventory.quantity, reorder_level=inventory.reorder_level,
        reorder_quantity=inventory.reorder_quantity, last_updated=inventory.last_updated,
        product_name=product.name, product_sku=product.sku, location_name=location.name,
        is_low_stock=inventory.quantity <= inventory.reorder_level
    )


@router.put("/{inventory_id}", response_model=InventoryResponse)
async def update_inventory(
    inventory_id: int,
    data: InventoryUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: ManagerUser,
):
    """Update an inventory record."""
    result = await db.execute(
        select(Inventory).options(selectinload(Inventory.product), selectinload(Inventory.location))
        .where(Inventory.id == inventory_id)
    )
    inventory = result.scalar_one_or_none()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(inventory, field, value)
    
    await db.commit()
    await db.refresh(inventory)
    
    return InventoryResponse(
        id=inventory.id, product_id=inventory.product_id, location_id=inventory.location_id,
        quantity=inventory.quantity, reorder_level=inventory.reorder_level,
        reorder_quantity=inventory.reorder_quantity, last_updated=inventory.last_updated,
        product_name=inventory.product.name if inventory.product else None,
        product_sku=inventory.product.sku if inventory.product else None,
        location_name=inventory.location.name if inventory.location else None,
        is_low_stock=inventory.quantity <= inventory.reorder_level
    )
