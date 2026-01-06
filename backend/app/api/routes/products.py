from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.product import Product
from app.models.inventory import Inventory
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
)
from app.api.deps import CurrentUser, ManagerUser


router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=ProductListResponse)
async def get_products(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    supplier_id: Optional[int] = None,
    is_active: Optional[bool] = None,
):
    """Get all products with pagination and filtering."""
    query = select(Product).options(
        selectinload(Product.category),
        selectinload(Product.supplier)
    )
    
    if search:
        query = query.where(
            (Product.name.ilike(f"%{search}%")) |
            (Product.sku.ilike(f"%{search}%")) |
            (Product.barcode.ilike(f"%{search}%"))
        )
    
    if category_id:
        query = query.where(Product.category_id == category_id)
    
    if supplier_id:
        query = query.where(Product.supplier_id == supplier_id)
    
    if is_active is not None:
        query = query.where(Product.is_active == is_active)
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    # Apply pagination
    query = query.order_by(Product.name)
    query = query.offset((page - 1) * size).limit(size)
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    # Build response with additional data
    items = []
    for product in products:
        # Get total stock
        stock_result = await db.execute(
            select(func.sum(Inventory.quantity))
            .where(Inventory.product_id == product.id)
        )
        total_stock = stock_result.scalar() or 0
        
        item = ProductResponse(
            id=product.id,
            sku=product.sku,
            name=product.name,
            description=product.description,
            unit_price=product.unit_price,
            cost_price=product.cost_price,
            barcode=product.barcode,
            unit=product.unit,
            image_url=product.image_url,
            category_id=product.category_id,
            supplier_id=product.supplier_id,
            is_active=product.is_active,
            created_at=product.created_at,
            updated_at=product.updated_at,
            category_name=product.category.name if product.category else None,
            supplier_name=product.supplier.name if product.supplier else None,
            total_stock=total_stock
        )
        items.append(item)
    
    return ProductListResponse(
        items=items,
        total=total,
        page=page,
        size=size
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
):
    """Get a specific product by ID."""
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.supplier))
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Get total stock
    stock_result = await db.execute(
        select(func.sum(Inventory.quantity))
        .where(Inventory.product_id == product.id)
    )
    total_stock = stock_result.scalar() or 0
    
    return ProductResponse(
        id=product.id,
        sku=product.sku,
        name=product.name,
        description=product.description,
        unit_price=product.unit_price,
        cost_price=product.cost_price,
        barcode=product.barcode,
        unit=product.unit,
        image_url=product.image_url,
        category_id=product.category_id,
        supplier_id=product.supplier_id,
        is_active=product.is_active,
        created_at=product.created_at,
        updated_at=product.updated_at,
        category_name=product.category.name if product.category else None,
        supplier_name=product.supplier.name if product.supplier else None,
        total_stock=total_stock
    )


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: ManagerUser,
):
    """Create a new product (Manager/Admin only)."""
    # Check SKU uniqueness
    result = await db.execute(select(Product).where(Product.sku == product_data.sku))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SKU already exists"
        )
    
    product = Product(**product_data.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    
    return ProductResponse(
        id=product.id,
        sku=product.sku,
        name=product.name,
        description=product.description,
        unit_price=product.unit_price,
        cost_price=product.cost_price,
        barcode=product.barcode,
        unit=product.unit,
        image_url=product.image_url,
        category_id=product.category_id,
        supplier_id=product.supplier_id,
        is_active=product.is_active,
        created_at=product.created_at,
        updated_at=product.updated_at,
        total_stock=0
    )


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: ManagerUser,
):
    """Update a product (Manager/Admin only)."""
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.category), selectinload(Product.supplier))
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Check SKU uniqueness if updating SKU
    if product_data.sku and product_data.sku != product.sku:
        sku_result = await db.execute(
            select(Product).where(Product.sku == product_data.sku)
        )
        if sku_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU already exists"
            )
    
    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    await db.commit()
    await db.refresh(product)
    
    # Get total stock
    stock_result = await db.execute(
        select(func.sum(Inventory.quantity))
        .where(Inventory.product_id == product.id)
    )
    total_stock = stock_result.scalar() or 0
    
    return ProductResponse(
        id=product.id,
        sku=product.sku,
        name=product.name,
        description=product.description,
        unit_price=product.unit_price,
        cost_price=product.cost_price,
        barcode=product.barcode,
        unit=product.unit,
        image_url=product.image_url,
        category_id=product.category_id,
        supplier_id=product.supplier_id,
        is_active=product.is_active,
        created_at=product.created_at,
        updated_at=product.updated_at,
        category_name=product.category.name if product.category else None,
        supplier_name=product.supplier.name if product.supplier else None,
        total_stock=total_stock
    )


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: ManagerUser,
):
    """Delete a product (Manager/Admin only)."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    await db.delete(product)
    await db.commit()
