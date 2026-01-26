from datetime import datetime
from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field


# Base schema
class ProductBase(BaseModel):
    sku: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    unit_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    cost_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    barcode: Optional[str] = Field(None, max_length=100)
    unit: str = Field(default="pcs", max_length=20)
    image_url: Optional[str] = Field(None, max_length=500)
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None


# Create schema
class ProductCreate(ProductBase):
    initial_stock: int = Field(default=0, ge=0)  # Initial stock quantity


# Update schema
class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    unit_price: Optional[Decimal] = Field(None, ge=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    barcode: Optional[str] = Field(None, max_length=100)
    unit: Optional[str] = Field(None, max_length=20)
    image_url: Optional[str] = Field(None, max_length=500)
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    is_active: Optional[bool] = None
    new_stock: Optional[int] = Field(None, ge=0)  # New stock quantity


# Response schema
class ProductResponse(ProductBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    category_name: Optional[str] = None
    supplier_name: Optional[str] = None
    total_stock: int = 0

    class Config:
        from_attributes = True


# Product list response
class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    size: int


# Product search/filter
class ProductFilter(BaseModel):
    search: Optional[str] = None
    category_id: Optional[int] = None
    supplier_id: Optional[int] = None
    is_active: Optional[bool] = None
    low_stock_only: bool = False
