"""Pydantic schemas for Order.

shipping_status is intentionally absent from every *write* schema
(OrderCreate / OrderUpdate) — it is auto-derived by the service layer the
moment `tracking_number` is set, and must never be settable by a client.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.order_line_item import OrderLineItemCreate, OrderLineItemRead


class OrderCreate(BaseModel):
    channel: str
    customer_id: uuid.UUID | None = None
    shipping_cost_minor: int = Field(default=0, ge=0)
    shipping_type: str
    payment_method: str  # qr | card
    payment_status: str = "unpaid"
    coupon_code: str | None = None
    line_items: list[OrderLineItemCreate]


class OrderUpdate(BaseModel):
    """
    Patchable order fields.

    NOTE: tracking_number is the only field intended to drive
    shipping_status. Setting it auto-flips shipping_status to "shipped" in
    the service layer (see routers/orders.py). shipping_status itself is
    NOT a field here — clients cannot set it directly.
    """

    tracking_number: str | None = None
    payment_status: str | None = None


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    channel: str
    customer_id: uuid.UUID | None
    subtotal_minor: int
    shipping_cost_minor: int
    discount_amount_minor: int
    net_total_minor: int
    promotion_id: uuid.UUID | None
    shipping_type: str
    shipping_status: str
    payment_method: str | None
    payment_status: str
    tracking_number: str | None
    checkout_token: str | None
    checkout_token_expires_at: datetime | None
    line_items: list[OrderLineItemRead] = []
