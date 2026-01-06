from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.location import LocationType


# Base schema
class LocationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: LocationType = LocationType.WAREHOUSE
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=50)


# Create schema
class LocationCreate(LocationBase):
    pass


# Update schema
class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[LocationType] = None
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


# Response schema
class LocationResponse(LocationBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    products_count: int = 0
    total_items: int = 0

    class Config:
        from_attributes = True


# Location list response
class LocationListResponse(BaseModel):
    items: list[LocationResponse]
    total: int
