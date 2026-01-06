from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.location import Location
from app.models.inventory import Inventory
from app.schemas.location import (
    LocationCreate, LocationUpdate, LocationResponse, LocationListResponse
)
from app.api.deps import CurrentUser, ManagerUser


router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("", response_model=LocationListResponse)
async def get_locations(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
    is_active: Optional[bool] = None,
):
    """Get all locations."""
    query = select(Location)
    
    if is_active is not None:
        query = query.where(Location.is_active == is_active)
    
    result = await db.execute(query.order_by(Location.name))
    locations = result.scalars().all()
    
    # Build response with counts
    items = []
    for location in locations:
        # Get inventory stats
        inv_result = await db.execute(
            select(
                func.count(Inventory.id),
                func.coalesce(func.sum(Inventory.quantity), 0)
            ).where(Inventory.location_id == location.id)
        )
        products_count, total_items = inv_result.one()
        
        item = LocationResponse(
            id=location.id,
            name=location.name,
            type=location.type,
            address=location.address,
            phone=location.phone,
            is_active=location.is_active,
            created_at=location.created_at,
            updated_at=location.updated_at,
            products_count=products_count,
            total_items=total_items
        )
        items.append(item)
    
    return LocationListResponse(items=items, total=len(items))


@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(
    location_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: CurrentUser,
):
    """Get a specific location by ID."""
    result = await db.execute(select(Location).where(Location.id == location_id))
    location = result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Get inventory stats
    inv_result = await db.execute(
        select(
            func.count(Inventory.id),
            func.coalesce(func.sum(Inventory.quantity), 0)
        ).where(Inventory.location_id == location.id)
    )
    products_count, total_items = inv_result.one()
    
    return LocationResponse(
        id=location.id,
        name=location.name,
        type=location.type,
        address=location.address,
        phone=location.phone,
        is_active=location.is_active,
        created_at=location.created_at,
        updated_at=location.updated_at,
        products_count=products_count,
        total_items=total_items
    )


@router.post("", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    location_data: LocationCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: ManagerUser,
):
    """Create a new location (Manager/Admin only)."""
    location = Location(**location_data.model_dump())
    db.add(location)
    await db.commit()
    await db.refresh(location)
    
    return LocationResponse(
        id=location.id,
        name=location.name,
        type=location.type,
        address=location.address,
        phone=location.phone,
        is_active=location.is_active,
        created_at=location.created_at,
        updated_at=location.updated_at,
        products_count=0,
        total_items=0
    )


@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: int,
    location_data: LocationUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: ManagerUser,
):
    """Update a location (Manager/Admin only)."""
    result = await db.execute(select(Location).where(Location.id == location_id))
    location = result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    update_data = location_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(location, field, value)
    
    await db.commit()
    await db.refresh(location)
    
    # Get inventory stats
    inv_result = await db.execute(
        select(
            func.count(Inventory.id),
            func.coalesce(func.sum(Inventory.quantity), 0)
        ).where(Inventory.location_id == location.id)
    )
    products_count, total_items = inv_result.one()
    
    return LocationResponse(
        id=location.id,
        name=location.name,
        type=location.type,
        address=location.address,
        phone=location.phone,
        is_active=location.is_active,
        created_at=location.created_at,
        updated_at=location.updated_at,
        products_count=products_count,
        total_items=total_items
    )


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    location_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: ManagerUser,
):
    """Delete a location (Manager/Admin only)."""
    result = await db.execute(select(Location).where(Location.id == location_id))
    location = result.scalar_one_or_none()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Check if location has inventory
    inv_result = await db.execute(
        select(func.count(Inventory.id)).where(Inventory.location_id == location_id)
    )
    if inv_result.scalar() > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete location with inventory. Move or delete inventory first."
        )
    
    await db.delete(location)
    await db.commit()
