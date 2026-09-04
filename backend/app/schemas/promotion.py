"""Pydantic schemas for Promotion."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class PromotionBase(BaseModel):
    name: str
    description: str | None = None
    condition_type: str  # qty | amount | variant
    discount_type: str  # percent | fixed | bogo
    min_value: float = 0
    start_date: date
    end_date: date | None = None
    priority: int = 0
    auto_apply: bool = False
    manual_selectable: bool = False
    stackable: bool = False
    bogo_buy_qty: int | None = None
    bogo_get_qty: int | None = None
    bogo_get_discount_pct: float | None = None
    coupon_code: str | None = None
    coupon_redemption_limit_total: int | None = None
    coupon_redemption_limit_per_customer: int | None = None
    coupon_valid_from: datetime | None = None
    coupon_valid_until: datetime | None = None
    is_reward_coupon: bool = False
    reward_threshold_amount_minor: int | None = None
    reward_parent_promotion_id: uuid.UUID | None = None


class PromotionCreate(PromotionBase):
    status: str = "inactive"


class PromotionUpdate(BaseModel):
    """Partial update. Note: flipping `status` (activation) is expected to
    be gated by require_role("owner_admin") at the router level."""

    name: str | None = None
    description: str | None = None
    status: str | None = None
    condition_type: str | None = None
    discount_type: str | None = None
    min_value: float | None = None
    start_date: date | None = None
    end_date: date | None = None
    priority: int | None = None
    auto_apply: bool | None = None
    manual_selectable: bool | None = None
    stackable: bool | None = None
    bogo_buy_qty: int | None = None
    bogo_get_qty: int | None = None
    bogo_get_discount_pct: float | None = None
    coupon_code: str | None = None
    coupon_redemption_limit_total: int | None = None
    coupon_redemption_limit_per_customer: int | None = None
    coupon_valid_from: datetime | None = None
    coupon_valid_until: datetime | None = None


class PromotionRead(PromotionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: str
    coupon_redemption_count: int
    created_at: datetime
    updated_at: datetime
