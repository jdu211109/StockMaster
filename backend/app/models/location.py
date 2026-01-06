from datetime import datetime
from typing import Optional
from enum import Enum
from sqlalchemy import String, Text, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class LocationType(str, Enum):
    """Types of inventory locations."""
    STORE = "store"
    WAREHOUSE = "warehouse"


class Location(Base):
    """Location model for stores and warehouses."""
    
    __tablename__ = "locations"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    type: Mapped[LocationType] = mapped_column(
        SQLEnum(LocationType), 
        default=LocationType.WAREHOUSE, 
        nullable=False
    )
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    inventory_items = relationship("Inventory", back_populates="location")
    transactions = relationship("Transaction", back_populates="location", foreign_keys="[Transaction.location_id]")
    
    def __repr__(self) -> str:
        return f"<Location(id={self.id}, name='{self.name}', type='{self.type}')>"
