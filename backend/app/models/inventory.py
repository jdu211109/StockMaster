from datetime import datetime
from sqlalchemy import ForeignKey, DateTime, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Inventory(Base):
    """Inventory model for tracking stock levels per product per location."""
    
    __tablename__ = "inventory"
    
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
    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reorder_level: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    reorder_quantity: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    last_updated: Mapped[datetime] = mapped_column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Unique constraint: one inventory record per product per location
    __table_args__ = (
        UniqueConstraint('product_id', 'location_id', name='uq_product_location'),
    )
    
    # Relationships
    product = relationship("Product", back_populates="inventory_items")
    location = relationship("Location", back_populates="inventory_items")
    
    @property
    def is_low_stock(self) -> bool:
        """Check if stock is below reorder level."""
        return self.quantity <= self.reorder_level
    
    def __repr__(self) -> str:
        return f"<Inventory(product_id={self.product_id}, location_id={self.location_id}, qty={self.quantity})>"
