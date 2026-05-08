"""
READ side of CQRS.

Owns the ProductView projection: a denormalized, query-optimized shape derived
from the Product aggregate. The write side calls project() after each command;
the event handler in main.py also calls project() (via commands.confirm_sale)
when OrderConfirmed arrives, to bump the sold counter.

ProductView intentionally has fields the write side does NOT have (stock_level
bucket, sold_count). That asymmetry is the whole point of CQRS — the read model
is shaped for the queries it serves, not for the invariants the write side
enforces.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from threading import Lock
from typing import Literal, Optional

log = logging.getLogger("catalog.queries")


StockLevel = Literal["in_stock", "low", "out"]


@dataclass
class ProductView:
    id: str
    name: str
    price: float
    stock_on_hand: int
    stock_level: StockLevel
    sold_count: int
    last_updated: str  # ISO 8601


# --- Read store (in-memory). Updated by the write side via project(). ----------

_views: dict[str, ProductView] = {}
_lock = Lock()


def _bucket(stock: int) -> StockLevel:
    if stock <= 0:
        return "out"
    if stock < 5:
        return "low"
    return "in_stock"


def project(product, sold_delta: int = 0) -> None:
    """Recompute the ProductView for `product`. sold_delta bumps the read-side counter."""
    with _lock:
        existing = _views.get(product.id)
        sold = (existing.sold_count if existing else 0) + sold_delta
        _views[product.id] = ProductView(
            id=product.id,
            name=product.name,
            price=product.price,
            stock_on_hand=product.stock_on_hand,
            stock_level=_bucket(product.stock_on_hand),
            sold_count=sold,
            last_updated=datetime.now(timezone.utc).isoformat(),
        )


# --- Query ---------------------------------------------------------------------

def get_product_view(product_id: str) -> Optional[ProductView]:
    return _views.get(product_id)


def list_product_views() -> list[ProductView]:
    return list(_views.values())
