"""
Async event transport over Redis Streams.

We use Streams (not pub/sub) so events persist, support consumer groups, and require
explicit XACK — which makes it honest to teach idempotency and at-least-once delivery.

Stream:  microservices:events     (single stream, all event types share it)
Group:   catalog-service-group    (this service's consumer group)

Wire format on the stream:
    XADD microservices:events * type=OrderConfirmed payload=<json>

Each consumer reads with XREADGROUP, dispatches on the `type` field, and XACKs on
successful processing. A failure leaves the message in the pending list; in this demo
we re-raise and let it stay pending. A production system would add retry policy +
dead-letter handling.
"""

from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import asdict, dataclass
from typing import Awaitable, Callable

import redis.asyncio as redis

STREAM = "microservices:events"

log = logging.getLogger("catalog.events")


@dataclass
class OrderConfirmed:
    order_id: str
    product_id: str
    qty: int
    correlation_id: str

    @classmethod
    def from_payload(cls, payload: dict) -> "OrderConfirmed":
        return cls(
            order_id=payload["order_id"],
            product_id=payload["product_id"],
            qty=int(payload["qty"]),
            correlation_id=payload.get("correlation_id", ""),
        )


EventHandler = Callable[[OrderConfirmed], Awaitable[None]]


async def connect(url: str) -> redis.Redis:
    client = redis.from_url(url, decode_responses=True)
    await client.ping()
    return client


async def consume(
    client: redis.Redis,
    group: str,
    consumer: str,
    on_order_confirmed: EventHandler,
) -> None:
    """Run the consumer loop forever. Called as an asyncio task at app startup."""
    try:
        await client.xgroup_create(STREAM, group, id="0", mkstream=True)
    except redis.ResponseError as e:
        if "BUSYGROUP" not in str(e):
            raise

    log.info("consumer ready group=%s consumer=%s stream=%s", group, consumer, STREAM)

    while True:
        try:
            resp = await client.xreadgroup(
                groupname=group, consumername=consumer,
                streams={STREAM: ">"}, count=16, block=5_000,
            )
        except asyncio.CancelledError:
            log.info("consumer cancelled")
            return
        except Exception:
            log.exception("xreadgroup failed; backing off")
            await asyncio.sleep(1)
            continue

        if not resp:
            continue

        for _, messages in resp:
            for msg_id, fields in messages:
                event_type = fields.get("type")
                payload_raw = fields.get("payload", "{}")
                cid = fields.get("correlation_id", "")
                try:
                    payload = json.loads(payload_raw)
                    if event_type == "OrderConfirmed":
                        log.info("[cid=%s] consume OrderConfirmed %s", cid, payload)
                        await on_order_confirmed(OrderConfirmed.from_payload(payload))
                    else:
                        log.debug("[cid=%s] ignoring event type=%s", cid, event_type)
                    await client.xack(STREAM, group, msg_id)
                except Exception:
                    log.exception("[cid=%s] handler failed for %s; will remain pending", cid, msg_id)


async def publish(client: redis.Redis, event: OrderConfirmed) -> str:
    """Symmetry — exposed even though catalog only consumes today. orders-service has its own publisher in C#."""
    return await client.xadd(
        STREAM,
        {
            "type": "OrderConfirmed",
            "payload": json.dumps(asdict(event)),
            "correlation_id": event.correlation_id,
        },
    )
