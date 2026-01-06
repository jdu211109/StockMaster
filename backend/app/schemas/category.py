from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# Base schema
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    parent_id: Optional[int] = None


# Create schema
class CategoryCreate(CategoryBase):
    pass


# Update schema
class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    parent_id: Optional[int] = None


# Response schema
class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Category with children
class CategoryWithChildren(CategoryResponse):
    children: List["CategoryWithChildren"] = []
    products_count: int = 0


# Category list response
class CategoryListResponse(BaseModel):
    items: list[CategoryResponse]
    total: int
