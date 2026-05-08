"""
Catalog service composition root.

What lives here: HTTP routes, FastAPI app wiring, the lifespan that seeds products,
opens the Redis connection, and spawns the event-consumer background task.

What does NOT live here: domain logic. Commands live in commands.py, queries live
in queries.py, event transport lives in events.py. main.py only glues them.
"""

from __future__ import annotations

import asyncio
import contextlib
import logging
import os
import uuid
from contextvars import ContextVar
from dataclasses import asdict

from fastapi import FastAPI, Header, HTTPException, Request
from pydantic import BaseModel, Field

from app import commands, events, queries

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [cid=%(cid)s] %(name)s: %(message)s",
)

# Correlation ID — propagated end-to-end across services so `docker compose logs`
# can be filtered by a single request's path through the system.
_CID: ContextVar[str] = ContextVar("cid", default="-")


class _CidFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        record.cid = _CID.get()
        return True


for h in logging.getLogger().handlers:
    h.addFilter(_CidFilter())

log = logging.getLogger("catalog")


# --- Lifespan: seed, connect, consume ------------------------------------------

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    commands.seed([
        commands.Product(id="p-1", name="Widget", price=19.99, stock_on_hand=10),
        commands.Product(id="p-2", name="Gizmo",  price=9.99,  stock_on_hand=3),
    ])

    redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379")
    client = await events.connect(redis_url)

    async def on_order_confirmed(ev: events.OrderConfirmed) -> None:
        token = _CID.set(ev.correlation_id or "-")
        try:
            try:
                commands.confirm_sale(ev.product_id, ev.qty)
            except commands.UnknownProduct:
                log.warning("OrderConfirmed for unknown product %s — ignoring", ev.product_id)
        finally:
            _CID.reset(token)

    consumer_task = asyncio.create_task(
        events.consume(client, group="catalog-service-group",
                       consumer=f"c-{uuid.uuid4().hex[:6]}",
                       on_order_confirmed=on_order_confirmed),
        name="event-consumer",
    )
    log.info("ready")
    try:
        yield
    finally:
        consumer_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await consumer_task
        await client.aclose()


app = FastAPI(title="catalog-service", lifespan=lifespan)


# --- Correlation-ID middleware -------------------------------------------------

@app.middleware("http")
async def correlation_id(request: Request, call_next):
    cid = request.headers.get("x-correlation-id") or f"cat-{uuid.uuid4().hex[:8]}"
    token = _CID.set(cid)
    try:
        response = await call_next(request)
        response.headers["x-correlation-id"] = cid
        return response
    finally:
        _CID.reset(token)


# --- Pydantic input models -----------------------------------------------------

class ReserveRequest(BaseModel):
    qty: int = Field(gt=0)


class ReleaseRequest(BaseModel):
    qty: int = Field(gt=0)


# --- Routes --------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/products")
def list_products():
    return [asdict(v) for v in queries.list_product_views()]


@app.get("/products/{product_id}")
def get_product(product_id: str):
    view = queries.get_product_view(product_id)
    if view is None:
        raise HTTPException(status_code=404, detail="product_not_found")
    return asdict(view)


@app.post("/products/{product_id}/reserve")
def reserve(product_id: str, body: ReserveRequest):
    """WRITE: decrement stock. 409 if insufficient."""
    try:
        product = commands.decrement_stock(product_id, body.qty)
    except commands.UnknownProduct:
        raise HTTPException(status_code=404, detail="product_not_found")
    except commands.InsufficientStock as e:
        raise HTTPException(status_code=409, detail=str(e))
    return {"product_id": product.id, "stock_on_hand": product.stock_on_hand}


@app.post("/products/{product_id}/release")
def release(product_id: str, body: ReleaseRequest):
    """WRITE (compensating): put stock back. Called by orders-service when
    a downstream saga step fails after this product had been reserved."""
    try:
        product = commands.release_stock(product_id, body.qty)
    except commands.UnknownProduct:
        raise HTTPException(status_code=404, detail="product_not_found")
    return {"product_id": product.id, "stock_on_hand": product.stock_on_hand}
