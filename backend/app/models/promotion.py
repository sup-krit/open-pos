"""Promotion model — drives services/promotions.py's apply_promotions()."""

import uuid
from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    BigInteger,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Promotion(Base):
    __tablename__ = "promotions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)

    status: Mapped[str] = mapped_column(String, nullable=False, default="inactive")  # active|inactive

    condition_type: Mapped[str] = mapped_column(String, nullable=False)  # qty|amount|variant
    discount_type: Mapped[str] = mapped_column(String, nullable=False)  # percent|fixed|bogo
    min_value: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False, default=0)

    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    priority: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    auto_apply: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    manual_selectable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    stackable: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # BOGO ("buy X get Y") specifics
    bogo_buy_qty: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bogo_get_qty: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bogo_get_discount_pct: Mapped[float | None] = mapped_column(Numeric(5, 2), nullable=True)

    # Coupon gating
    coupon_code: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    coupon_redemption_limit_total: Mapped[int | None] = mapped_column(Integer, nullable=True)
    coupon_redemption_limit_per_customer: Mapped[int | None] = mapped_column(Integer, nullable=True)
    coupon_redemption_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    coupon_valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    coupon_valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Reward-coupon issuance (self-referential)
    is_reward_coupon: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    reward_threshold_amount_minor: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    reward_parent_promotion_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("promotions.id"), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
