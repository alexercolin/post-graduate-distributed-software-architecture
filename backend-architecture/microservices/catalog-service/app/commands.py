"""
WRITE side of CQRS.

Owns the Product aggregate and the in-memory write store. Mutations happen here;
the read side is updated via project() after each successful command.

Why a separate file from queries.py: the file names are the lesson. A reader
opening this folder sees commands.py / queries.py side by side and immediately
understands "two ports into one bounded context."
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from threading import Lock

from app import queries

log = logging.getLogger("catalog.commands")


# --- Aggregate -----------------------------------------------------------------

@dataclass
class Product:
    id: str
    name: str
    price: float
    stock_on_hand: int


class InsufficientStock(Exception):
    pass


class UnknownProduct(Exception):
    pass


# --- Write store (in-memory, single-process). One lock guards mutations. -------

_store: dict[str, Product] = {}
_lock = Lock()


def seed(products: list[Product]) -> None:
    with _lock:
        for p in products:
            _store[p.id] = p
            queries.project(p, sold_delta=0)
    log.info("seeded %d products", len(products))


# --- Commands ------------------------------------------------------------------

def decrement_stock(product_id: str, qty: int) -> Product:
    """Reserve qty units. Raises InsufficientStock if not enough."""
    if qty <= 0:
        raise ValueError("qty must be positive")
    with _lock:
        product = _store.get(product_id)
        if product is None:
            raise UnknownProduct(product_id)
        if product.stock_on_hand < qty:
            raise InsufficientStock(
                f"product {product_id}: requested {qty}, have {product.stock_on_hand}"
            )
        product.stock_on_hand -= qty
        queries.project(product, sold_delta=0)  # availability changed; sold not yet
    log.info("DecrementStock id=%s qty=%d remaining=%d", product_id, qty, product.stock_on_hand)
    return product


def release_stock(product_id: str, qty: int) -> Product:
    """Compensating action: put qty units back. Used when a saga step downstream fails."""
    if qty <= 0:
        raise ValueError("qty must be positive")
    with _lock:
        product = _store.get(product_id)
        if product is None:
            raise UnknownProduct(product_id)
        product.stock_on_hand += qty
        queries.project(product, sold_delta=0)
    log.info("ReleaseStock id=%s qty=%d remaining=%d", product_id, qty, product.stock_on_hand)
    return product


def confirm_sale(product_id: str, qty: int) -> Product:
    """Called from the event handler when OrderConfirmed arrives. Stock was already
    decremented at reservation time; here we just bump the read-side sold counter."""
    with _lock:
        product = _store.get(product_id)
        if product is None:
            raise UnknownProduct(product_id)
        queries.project(product, sold_delta=qty)
    log.info("ConfirmSale id=%s qty=%d", product_id, qty)
    return product
