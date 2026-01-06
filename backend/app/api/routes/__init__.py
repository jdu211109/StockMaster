"""API routes initialization."""
from app.api.routes.auth import router as auth_router
from app.api.routes.categories import router as categories_router
from app.api.routes.suppliers import router as suppliers_router
from app.api.routes.products import router as products_router
from app.api.routes.locations import router as locations_router
from app.api.routes.inventory import router as inventory_router
from app.api.routes.transactions import router as transactions_router

__all__ = [
    "auth_router",
    "categories_router",
    "suppliers_router",
    "products_router",
    "locations_router",
    "inventory_router",
    "transactions_router",
]
