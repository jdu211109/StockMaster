"""API module initialization."""
from app.api.deps import get_current_user, get_current_active_user, require_roles
from app.api.routes import (
    auth_router,
    categories_router,
    suppliers_router,
    products_router,
    locations_router,
    inventory_router,
    transactions_router,
)

__all__ = [
    "get_current_user",
    "get_current_active_user",
    "require_roles",
    "auth_router",
    "categories_router",
    "suppliers_router",
    "products_router",
    "locations_router",
    "inventory_router",
    "transactions_router",
]
