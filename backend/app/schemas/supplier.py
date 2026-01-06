from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr


# Base schema
class SupplierBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    contact_person: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    notes: Optional[str] = None


# Create schema
class SupplierCreate(SupplierBase):
    pass


# Update schema
class SupplierUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    contact_person: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=50)
    address: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


# Response schema
class SupplierResponse(SupplierBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    products_count: int = 0

    class Config:
        from_attributes = True


# Supplier list response
class SupplierListResponse(BaseModel):
    items: list[SupplierResponse]
    total: int
    page: int
    size: int
