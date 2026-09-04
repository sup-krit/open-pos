"""Order model.

IMPORTANT — shipping_status is AUTO-DERIVED:
`shipping_status` becomes "shipped" the moment `tracking_number` is set,
and is never settable directly by API clients. This model exposes the
column so the ORM can read/write it, but callers must go through
services (see routers/orders.py) which enforce: setting tracking_number
always flips shipping_status to "shipped"; shipping_status is otherwise
left as "new_order" and is never accepted directly from client input.
"""

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    channel: Mapped[str] = mapped_column(String, nullable=False)
    customer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True
    )

    subtotal_minor: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    shipping_cost_minor: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    discount_amount_minor: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    net_total_minor: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    promotion_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("promotions.id"), nullable=True
    )

    shipping_type: Mapped[str] = mapped_column(String, nullable=False)

    # AUTO-DERIVED — never set directly from client input. See module
    # docstring and services layer (orders.set_tracking_number()).
    shipping_status: Mapped[str] = mapped_column(
        String, nullable=False, default="new_order"
    )  # "new_order" | "shipped"

    payment_method: Mapped[str | None] = mapped_column(String, nullable=True)  # qr | card
    payment_status: Mapped[str] = mapped_column(
        String, nullable=False, default="unpaid"
    )  # unpaid | paid | deposit

    tracking_number: Mapped[str | None] = mapped_column(String, nullable=True)

    checkout_token: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)
    checkout_token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    line_items: Mapped[list["OrderLineItem"]] = relationship(
        "OrderLineItem", back_populates="order", cascade="all, delete-orphan"
    )
