"""Bank-statement PDF parsing (single bank format supported at launch).

Not implemented — this is a signature + docstring stub. Real implementation
would extract transaction rows (date, description, debit/credit, running
balance) from the bank's PDF export layout and return them for bulk-insert
into `accounting_transactions` with reconciliation_status="needs_review".
"""

from dataclasses import dataclass
from datetime import date


@dataclass
class TransactionRow:
    """One parsed row from a bank statement PDF, prior to DB insertion."""

    date: date
    description: str
    debit_minor: int
    credit_minor: int
    balance_minor: int


def parse_statement(pdf_bytes: bytes) -> list[TransactionRow]:
    """
    Parse a bank statement PDF (single supported bank format at launch)
    into a list of TransactionRow.

    TODO: Implement PDF text/table extraction (e.g. via pdfplumber or
    similar), map the bank's specific column layout to TransactionRow
    fields, and handle multi-page statements + running-balance
    continuation across pages. Money values must be parsed into integer
    minor units (never float), per project convention.
    """
    raise NotImplementedError(
        "Bank-statement PDF parsing is not yet implemented for any bank format."
    )
