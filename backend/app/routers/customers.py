"""Customers router — total_orders/total_spent are computed via a
join/aggregate query against orders, never stored on the customer row.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.customer import CustomerCreate, CustomerRead

router = APIRouter(tags=["customers"])


def _aggregate_stmt():
    """Base SELECT joining customers to an order aggregate (orders + net spend)."""
    return (
        select(
            Customer,
            func.count(Order.id).label("total_orders"),
            func.coalesce(func.sum(Order.net_total_minor), 0).label("total_spent_minor"),
        )
        .outerjoin(Order, Order.customer_id == Customer.id)
        .group_by(Customer.id)
    )


def _to_read(row) -> CustomerRead:
    customer, total_orders, total_spent_minor = row
    data = CustomerRead.model_validate(customer)
    return data.model_copy(
        update={"total_orders": total_orders, "total_spent_minor": total_spent_minor}
    )


@router.get("", response_model=list[CustomerRead])
async def list_customers(db: AsyncSession = Depends(get_db)):
    result = await db.execute(_aggregate_stmt().order_by(Customer.name))
    return [_to_read(row) for row in result.all()]


@router.get("/{customer_id}", response_model=CustomerRead)
async def get_customer(customer_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = _aggregate_stmt().where(Customer.id == customer_id)
    result = await db.execute(stmt)
    row = result.first()
    if row is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    return _to_read(row)


@router.post("", response_model=CustomerRead, status_code=201)
async def create_customer(payload: CustomerCreate, db: AsyncSession = Depends(get_db)):
    customer = Customer(**payload.model_dump())
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    data = CustomerRead.model_validate(customer)
    return data.model_copy(update={"total_orders": 0, "total_spent_minor": 0})
