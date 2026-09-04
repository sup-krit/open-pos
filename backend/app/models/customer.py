"""Customer model.

total_orders / total_spent are intentionally NOT columns here — they are
derived via aggregate queries (see services/routers for customers) against
`orders`, never denormalized onto this row.
"""

import uuid

from sqlalchemy import Boolean, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str | None] = mapped_column(String, nullable=True, index=True)
    social_handle: Mapped[str | None] = mapped_column(String, nullable=True)
    tag: Mapped[str | None] = mapped_column(String, nullable=True)  # e.g. "VIP"
    pdpa_consent: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    address_subdistrict: Mapped[str | None] = mapped_column(String, nullable=True)
    address_district: Mapped[str | None] = mapped_column(String, nullable=True)
    address_province: Mapped[str | None] = mapped_column(String, nullable=True)
