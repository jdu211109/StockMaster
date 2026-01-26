from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.location import Location
from app.models.transaction import Transaction, TransactionType
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
)
from app.api.deps import CurrentUser


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
    current_user: CurrentUser,
):
    """Create a new product."""
    # Check SKU uniqueness
    result = await db.execute(select(Product).where(Product.sku == product_data.sku))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="SKU already exists"
        )
    
    # Extract initial_stock before creating product
    initial_stock = product_data.initial_stock
    product_dict = product_data.model_dump(exclude={'initial_stock'})
    
    product = Product(**product_dict)
    db.add(product)
    await db.flush()  # Get product ID
    
    # If initial stock is provided, create inventory and transaction
    total_stock = 0
    if initial_stock > 0:
        # Get or create default location
        location_result = await db.execute(select(Location).limit(1))
        location = location_result.scalar_one_or_none()
        if not location:
            location = Location(name="Main Warehouse", type="warehouse")
            db.add(location)
            await db.flush()
        
        # Create inventory record
        inventory = Inventory(
            product_id=product.id,
            location_id=location.id,
            quantity=initial_stock,
            reorder_level=10,
            reorder_quantity=50
        )
        db.add(inventory)
        
        # Create transaction record
        transaction = Transaction(
            product_id=product.id,
            location_id=location.id,
            type=TransactionType.STOCK_IN,
            quantity=initial_stock,
            reference="Initial Stock",
            notes="Created during product registration",
            user_id=current_user.id
        )
        db.add(transaction)
        total_stock = initial_stock
    
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
        total_stock=total_stock
    )


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
):
    """Update a product."""
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
    
    # Handle stock update
    new_stock = product_data.new_stock
    update_data = product_data.model_dump(exclude_unset=True, exclude={'new_stock'})
    
    for field, value in update_data.items():
        setattr(product, field, value)
    
    # Update stock if new_stock is provided
    if new_stock is not None:
        # Get or create default location
        location_result = await db.execute(select(Location).limit(1))
        location = location_result.scalar_one_or_none()
        if not location:
            location = Location(name="Main Warehouse", type="warehouse")
            db.add(location)
            await db.flush()
        
        # Get current inventory
        inv_result = await db.execute(
            select(Inventory).where(
                (Inventory.product_id == product_id) & (Inventory.location_id == location.id)
            )
        )
        inventory = inv_result.scalar_one_or_none()
        
        current_stock = inventory.quantity if inventory else 0
        diff = new_stock - current_stock
        
        if diff != 0:
            # Create or update inventory
            if not inventory:
                inventory = Inventory(
                    product_id=product_id,
                    location_id=location.id,
                    quantity=new_stock,
                    reorder_level=10,
                    reorder_quantity=50
                )
                db.add(inventory)
            else:
                inventory.quantity = new_stock
            
            # Create adjustment transaction
            transaction = Transaction(
                product_id=product_id,
                location_id=location.id,
                type=TransactionType.STOCK_IN if diff > 0 else TransactionType.STOCK_OUT,
                quantity=abs(diff),
                reference="Stock Adjustment",
                notes=f"Stock change: {current_stock} → {new_stock}",
                user_id=current_user.id
            )
            db.add(transaction)
    
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
    current_user: CurrentUser,
):
    """Delete a product."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    await db.delete(product)
    await db.commit()


@router.get("/export/csv")
async def export_products_csv(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
):
    """Export products to CSV."""
    from fastapi.responses import StreamingResponse
    from datetime import datetime
    import io
    import csv
    
    query = select(Product).options(
        selectinload(Product.category),
        selectinload(Product.supplier)
    ).order_by(Product.name)
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    output = io.StringIO()
    output.write('\ufeff')  # BOM for Excel
    writer = csv.writer(output, delimiter=';')
    writer.writerow(['SKU', 'Name', 'Description', 'Sale Price', 'Cost Price', 'Unit', 'Stock'])
    
    for p in products:
        # Get total stock
        stock_result = await db.execute(
            select(func.sum(Inventory.quantity))
            .where(Inventory.product_id == p.id)
        )
        total_stock = stock_result.scalar() or 0
        
        writer.writerow([
            p.sku,
            p.name,
            p.description or '',
            float(p.unit_price),
            float(p.cost_price),
            p.unit,
            total_stock
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=products_{datetime.now().strftime('%Y%m%d')}.csv"}
    )
