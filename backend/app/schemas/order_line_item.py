"""Pydantic schemas for OrderLineItem."""

import uuid

from pydantic import BaseModel, ConfigDict, Field


class OrderLineItemCreate(BaseModel):
    product_id: uuid.UUID
    qty: int = Field(gt=0)
    unit_price_minor: int = Field(ge=0)


class OrderLineItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    product_id: uuid.UUID
    qty: int
    unit_price_minor: int
