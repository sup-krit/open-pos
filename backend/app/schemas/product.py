"""Pydantic schemas for Product (business term "InventoryItem")."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    sku: str
    name: str
    group_name: str | None = None
    variant_attribute: str | None = None
    lot: str | None = None
    cost_minor: int = Field(ge=0, description="Cost in integer minor units (e.g. satang).")
    price_minor: int = Field(ge=0, description="Price in integer minor units (e.g. satang).")
    stock_quantity: int = Field(ge=0, default=0)
    low_stock_threshold: int = Field(ge=0, default=5)
    vendor: str | None = None
    custom_fields: dict = Field(default_factory=dict)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    """Partial update — used for inline-edit in the products grid."""

    sku: str | None = None
    name: str | None = None
    group_name: str | None = None
    variant_attribute: str | None = None
    lot: str | None = None
    cost_minor: int | None = Field(default=None, ge=0)
    price_minor: int | None = Field(default=None, ge=0)
    stock_quantity: int | None = Field(default=None, ge=0)
    low_stock_threshold: int | None = Field(default=None, ge=0)
    vendor: str | None = None
    custom_fields: dict | None = None
    # status is intentionally NOT accepted here — it's auto-derived.


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    margin_pct: float
    profit_minor: int
    status: str
    created_at: datetime
    updated_at: datetime
