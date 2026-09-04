"""Pydantic schemas for the public checkout flow (routers/checkout.py)."""

import uuid
from datetime import datetime

from pydantic import BaseModel


class CheckoutOrderSummary(BaseModel):
    """Shape-correct subset of order data shown on the public address form."""

    order_id: uuid.UUID
    net_total_minor: int
    shipping_type: str
    payment_method: str
    payment_status: str


class CheckoutCustomerSummary(BaseModel):
    name: str | None = None
    phone: str | None = None


class CheckoutRead(BaseModel):
    """GET /checkout/{token} response."""

    order: CheckoutOrderSummary
    customer: CheckoutCustomerSummary
    token_expires_at: datetime | None


class CheckoutAddressSubmit(BaseModel):
    """POST /checkout/{token}/address request body."""

    name: str
    phone: str
    social_handle: str | None = None
    address_subdistrict: str | None = None
    address_district: str | None = None
    address_province: str | None = None


class CheckoutAddressResult(BaseModel):
    ok: bool
    order_id: uuid.UUID
