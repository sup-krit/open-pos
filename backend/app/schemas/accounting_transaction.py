"""Pydantic schemas for AccountingTransaction."""

import uuid
from datetime import date

from pydantic import BaseModel, ConfigDict


class AccountingTransactionBase(BaseModel):
    date: date
    description: str | None = None
    debit_minor: int = 0
    credit_minor: int = 0
    balance_minor: int = 0
    category: str | None = None


class AccountingTransactionCreate(AccountingTransactionBase):
    pass


class AccountingTransactionUpdate(BaseModel):
    reconciliation_status: str | None = None  # needs_review | matched
    category: str | None = None


class AccountingTransactionRead(AccountingTransactionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    reconciliation_status: str


class MonthlySummary(BaseModel):
    """Shape returned by GET /api/accounting/monthly-summary."""

    month: str  # "YYYY-MM"
    income_minor: int
    expense_minor: int
    gross_profit_minor: int
