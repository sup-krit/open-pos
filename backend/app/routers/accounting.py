"""Accounting router — owner/admin-gated per project requirements (the
whole router is mounted behind require_role, not just individual routes).
"""

from datetime import date

from fastapi import APIRouter, Depends, File, Query, UploadFile
from sqlalchemy import extract, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import CurrentUser, require_role
from app.db.session import get_db
from app.models.accounting_transaction import AccountingTransaction
from app.schemas.accounting_transaction import (
    AccountingTransactionCreate,
    AccountingTransactionRead,
    MonthlySummary,
)
from app.services.accounting import parse_statement

router = APIRouter(
    tags=["accounting"],
    dependencies=[Depends(require_role("owner_admin"))],
)


@router.get("/transactions", response_model=list[AccountingTransactionRead])
async def list_transactions(
    db: AsyncSession = Depends(get_db),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
    reconciliation_status: str | None = Query(default=None),
):
    stmt = select(AccountingTransaction)
    if date_from:
        stmt = stmt.where(AccountingTransaction.date >= date_from)
    if date_to:
        stmt = stmt.where(AccountingTransaction.date <= date_to)
    if reconciliation_status:
        stmt = stmt.where(
            AccountingTransaction.reconciliation_status == reconciliation_status
        )
    stmt = stmt.order_by(AccountingTransaction.date.desc())

    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/upload-statement", response_model=list[AccountingTransactionRead], status_code=201)
async def upload_statement(
    db: AsyncSession = Depends(get_db),
    file: UploadFile = File(...),
):
    """
    Upload a bank-statement PDF, parse it, and bulk-insert the resulting
    transactions with reconciliation_status="needs_review".

    NOTE: services.accounting.parse_statement() currently raises
    NotImplementedError (single-bank-format PDF parsing is a TODO) — this
    endpoint will surface that as a 500 until the parser is implemented.
    """
    pdf_bytes = await file.read()
    rows = parse_statement(pdf_bytes)  # TODO: currently raises NotImplementedError

    transactions = [
        AccountingTransaction(
            date=row.date,
            description=row.description,
            debit_minor=row.debit_minor,
            credit_minor=row.credit_minor,
            balance_minor=row.balance_minor,
            category="uncategorized",
            reconciliation_status="needs_review",
        )
        for row in rows
    ]
    db.add_all(transactions)
    await db.commit()
    for t in transactions:
        await db.refresh(t)
    return transactions


@router.get("/monthly-summary", response_model=list[MonthlySummary])
async def monthly_summary(
    db: AsyncSession = Depends(get_db),
    year: int | None = Query(default=None),
):
    """Real aggregate query: income/expense/gross-profit grouped by month."""
    stmt = select(
        func.to_char(AccountingTransaction.date, "YYYY-MM").label("month"),
        func.coalesce(func.sum(AccountingTransaction.credit_minor), 0).label("income_minor"),
        func.coalesce(func.sum(AccountingTransaction.debit_minor), 0).label("expense_minor"),
    ).group_by("month").order_by("month")

    if year:
        stmt = stmt.where(extract("year", AccountingTransaction.date) == year)

    result = await db.execute(stmt)
    rows = result.all()
    return [
        MonthlySummary(
            month=row.month,
            income_minor=row.income_minor,
            expense_minor=row.expense_minor,
            gross_profit_minor=row.income_minor - row.expense_minor,
        )
        for row in rows
    ]
