from datetime import datetime
from typing import Optional
from enum import Enum
from sqlalchemy import String, Text, Integer, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class TransactionType(str, Enum):
    """Types of inventory transactions."""
    STOCK_IN = "stock_in"       # Receiving stock from supplier
    STOCK_OUT = "stock_out"     # Shipping/selling stock
    ADJUSTMENT = "adjustment"   # Manual inventory adjustment
    TRANSFER = "transfer"       # Transfer between locations
    RETURN = "return"           # Customer return


class Transaction(Base):
    """Transaction model for tracking all inventory movements."""
    
    __tablename__ = "transactions"
    
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    location_id: Mapped[int] = mapped_column(
        ForeignKey("locations.id", ondelete="CASCADE"), 
        nullable=False,
        index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), 
        nullable=True,
        index=True
    )
    
    type: Mapped[TransactionType] = mapped_column(
        SQLEnum(TransactionType), 
        nullable=False,
        index=True
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # PO number, invoice, etc.
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # For transfer transactions
    destination_location_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("locations.id", ondelete="SET NULL"), 
        nullable=True
    )
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        nullable=False,
        index=True
    )
    
    # Relationships
    product = relationship("Product", back_populates="transactions")
    location = relationship("Location", back_populates="transactions", foreign_keys=[location_id])
    destination_location = relationship("Location", foreign_keys=[destination_location_id])
    user = relationship("User", back_populates="transactions")
    
    def __repr__(self) -> str:
        return f"<Transaction(id={self.id}, type='{self.type}', product_id={self.product_id}, qty={self.quantity})>"
