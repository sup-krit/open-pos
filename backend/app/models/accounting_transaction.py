"""AccountingTransaction model.

No automatic matching against orders at launch — reconciliation_status is
set manually by staff via the accounting router.
"""

import uuid
from datetime import date as date_

from sqlalchemy import BigInteger, Date, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class AccountingTransaction(Base):
    __tablename__ = "accounting_transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    date: Mapped[date_] = mapped_column(Date, nullable=False)
    description: Mapped[str | None] = mapped_column(String, nullable=True)

    debit_minor: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    credit_minor: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    balance_minor: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    category: Mapped[str | None] = mapped_column(String, nullable=True)
    reconciliation_status: Mapped[str] = mapped_column(
        String, nullable=False, default="needs_review"
    )  # needs_review | matched
