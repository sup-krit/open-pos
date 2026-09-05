"""Product model (business term: "InventoryItem")."""

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    sku: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    group_name: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    variant_attribute: Mapped[str | None] = mapped_column(String, nullable=True)
    lot: Mapped[str | None] = mapped_column(String, nullable=True)

    cost_minor: Mapped[int] = mapped_column(BigInteger, nullable=False)
    price_minor: Mapped[int] = mapped_column(BigInteger, nullable=False)

    # margin_pct / profit_minor are computed from cost/price. They are
    # stored (not generated columns) so they can be indexed/filtered
    # cheaply; the service layer is responsible for keeping them in sync
    # on create/update.
    margin_pct: Mapped[float] = mapped_column(Numeric(7, 4), nullable=False, default=0)
    profit_minor: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, nullable=False, default=5)

    # Derived from stock_quantity vs. low_stock_threshold via
    # app.services.products.compute_status — never set directly by clients.
    status: Mapped[str] = mapped_column(String, nullable=False, default="in_stock")

    vendor: Mapped[str | None] = mapped_column(String, nullable=True)
    custom_fields: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
