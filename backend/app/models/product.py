"""Product model (business term: "InventoryItem")."""

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Numeric, String, func
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
    group_name: Mapped[str] = mapped_column(String, nullable=False, index=True)
    variant_attribute: Mapped[str | None] = mapped_column(String, nullable=True)
    lot: Mapped[str] = mapped_column(String, nullable=False)

    cost_minor: Mapped[int] = mapped_column(BigInteger, nullable=False)
    price_minor: Mapped[int] = mapped_column(BigInteger, nullable=False)

    # margin_pct / profit_minor are computed from cost/price. They are
    # stored (not generated columns) so they can be indexed/filtered
    # cheaply; the service layer is responsible for keeping them in sync
    # on create/update.
    margin_pct: Mapped[float] = mapped_column(Numeric(7, 4), nullable=False, default=0)
    profit_minor: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    # Auto-derived from a stock threshold — never set directly by clients.
    # TODO: wire this to an actual stock-quantity column/table once
    # inventory-quantity tracking is added; for now it's a plain text
    # field the service layer derives and writes.
    status: Mapped[str] = mapped_column(String, nullable=False, default="in_stock")

    vendor: Mapped[str] = mapped_column(String, nullable=False)
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
