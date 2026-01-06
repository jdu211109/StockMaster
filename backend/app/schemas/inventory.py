from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# Base schema
class InventoryBase(BaseModel):
    product_id: int
    location_id: int
    quantity: int = Field(default=0, ge=0)
    reorder_level: int = Field(default=10, ge=0)
    reorder_quantity: int = Field(default=50, ge=0)


# Create schema
class InventoryCreate(InventoryBase):
    pass


# Update schema
class InventoryUpdate(BaseModel):
    quantity: Optional[int] = Field(None, ge=0)
    reorder_level: Optional[int] = Field(None, ge=0)
    reorder_quantity: Optional[int] = Field(None, ge=0)


# Bulk update
class InventoryBulkUpdate(BaseModel):
    items: list[dict]  # [{"id": 1, "quantity": 100}, ...]


# Response schema
class InventoryResponse(InventoryBase):
    id: int
    last_updated: datetime
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    location_name: Optional[str] = None
    is_low_stock: bool = False

    class Config:
        from_attributes = True


# Inventory list response
class InventoryListResponse(BaseModel):
    items: list[InventoryResponse]
    total: int
    page: int
    size: int


# Low stock alert
class LowStockAlert(BaseModel):
    product_id: int
    product_name: str
    product_sku: str
    location_id: int
    location_name: str
    current_quantity: int
    reorder_level: int
    reorder_quantity: int


class LowStockAlertList(BaseModel):
    items: list[LowStockAlert]
    total: int
