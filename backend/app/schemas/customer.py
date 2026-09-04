"""Pydantic schemas for Customer.

total_orders / total_spent are derived (join/aggregate against orders) and
therefore only appear on CustomerRead, computed at query time — never
accepted on Create/Update.
"""

import uuid

from pydantic import BaseModel, ConfigDict


class CustomerBase(BaseModel):
    name: str
    phone: str
    social_handle: str | None = None
    tag: str | None = None
    pdpa_consent: bool = False
    address_subdistrict: str | None = None
    address_district: str | None = None
    address_province: str | None = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    social_handle: str | None = None
    tag: str | None = None
    pdpa_consent: bool | None = None
    address_subdistrict: str | None = None
    address_district: str | None = None
    address_province: str | None = None


class CustomerRead(CustomerBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    total_orders: int = 0
    total_spent_minor: int = 0
