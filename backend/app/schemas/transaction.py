from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.transaction import TransactionType


# Base schema
class TransactionBase(BaseModel):
    product_id: int
    location_id: int
    type: TransactionType
    quantity: int = Field(..., gt=0)
    reference: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None
    destination_location_id: Optional[int] = None  # For transfers


# Create schema
class TransactionCreate(TransactionBase):
    pass


# Response schema
class TransactionResponse(TransactionBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    location_name: Optional[str] = None
    destination_location_name: Optional[str] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True


# Transaction list response
class TransactionListResponse(BaseModel):
    items: list[TransactionResponse]
    total: int
    page: int
    size: int


# Transaction filter
class TransactionFilter(BaseModel):
    product_id: Optional[int] = None
    location_id: Optional[int] = None
    type: Optional[TransactionType] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    reference: Optional[str] = None
