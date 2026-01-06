from typing import Annotated, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.transaction import Transaction, TransactionType
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.location import Location
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionListResponse
from app.api.deps import CurrentUser


router = APIRouter(prefix="/transactions", tags=["Transactions"])


@router.get("", response_model=TransactionListResponse)
async def get_transactions(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    product_id: Optional[int] = None,
    location_id: Optional[int] = None,
    type: Optional[TransactionType] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
):
    """Get transactions with pagination and filtering."""
    query = select(Transaction).options(
        selectinload(Transaction.product),
        selectinload(Transaction.location),
        selectinload(Transaction.user)
    )
    
    if product_id:
        query = query.where(Transaction.product_id == product_id)
    if location_id:
        query = query.where(Transaction.location_id == location_id)
    if type:
        query = query.where(Transaction.type == type)
    if start_date:
        query = query.where(Transaction.created_at >= start_date)
    if end_date:
        query = query.where(Transaction.created_at <= end_date)
    
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar()
    
    query = query.order_by(Transaction.created_at.desc())
    query = query.offset((page - 1) * size).limit(size)
    
    result = await db.execute(query)
    items = [
        TransactionResponse(
            id=t.id, product_id=t.product_id, location_id=t.location_id,
            type=t.type, quantity=t.quantity, reference=t.reference,
            notes=t.notes, destination_location_id=t.destination_location_id,
            user_id=t.user_id, created_at=t.created_at,
            product_name=t.product.name if t.product else None,
            product_sku=t.product.sku if t.product else None,
            location_name=t.location.name if t.location else None,
            user_name=t.user.full_name if t.user else None
        ) for t in result.scalars().all()
    ]
    
    return TransactionListResponse(items=items, total=total, page=page, size=size)


@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    data: TransactionCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
):
    """Create a stock transaction and update inventory."""
    # Validate product
    product = (await db.execute(select(Product).where(Product.id == data.product_id))).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=400, detail="Product not found")
    
    # Validate location
    location = (await db.execute(select(Location).where(Location.id == data.location_id))).scalar_one_or_none()
    if not location:
        raise HTTPException(status_code=400, detail="Location not found")
    
    # Get or create inventory record
    inv_result = await db.execute(
        select(Inventory).where(
            (Inventory.product_id == data.product_id) & (Inventory.location_id == data.location_id)
        )
    )
    inventory = inv_result.scalar_one_or_none()
    
    if not inventory:
        inventory = Inventory(product_id=data.product_id, location_id=data.location_id, quantity=0)
        db.add(inventory)
    
    # Update inventory based on transaction type
    if data.type == TransactionType.STOCK_IN or data.type == TransactionType.RETURN:
        inventory.quantity += data.quantity
    elif data.type == TransactionType.STOCK_OUT:
        if inventory.quantity < data.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        inventory.quantity -= data.quantity
    elif data.type == TransactionType.ADJUSTMENT:
        inventory.quantity = data.quantity  # Direct set for adjustments
    elif data.type == TransactionType.TRANSFER:
        if not data.destination_location_id:
            raise HTTPException(status_code=400, detail="Destination required for transfer")
        if inventory.quantity < data.quantity:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        
        inventory.quantity -= data.quantity
        
        # Get or create destination inventory
        dest_inv = (await db.execute(
            select(Inventory).where(
                (Inventory.product_id == data.product_id) & 
                (Inventory.location_id == data.destination_location_id)
            )
        )).scalar_one_or_none()
        
        if not dest_inv:
            dest_inv = Inventory(product_id=data.product_id, location_id=data.destination_location_id, quantity=0)
            db.add(dest_inv)
        dest_inv.quantity += data.quantity
    
    # Create transaction record
    transaction = Transaction(
        product_id=data.product_id, location_id=data.location_id,
        type=data.type, quantity=data.quantity, reference=data.reference,
        notes=data.notes, destination_location_id=data.destination_location_id,
        user_id=current_user.id
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    
    return TransactionResponse(
        id=transaction.id, product_id=transaction.product_id, location_id=transaction.location_id,
        type=transaction.type, quantity=transaction.quantity, reference=transaction.reference,
        notes=transaction.notes, destination_location_id=transaction.destination_location_id,
        user_id=transaction.user_id, created_at=transaction.created_at,
        product_name=product.name, product_sku=product.sku, location_name=location.name,
        user_name=current_user.full_name
    )
