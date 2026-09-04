"""Public checkout router — no auth required (customer-facing address form
reached via a one-time token link, e.g. sent after a social-commerce sale).
"""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.schemas.checkout import (
    CheckoutAddressResult,
    CheckoutAddressSubmit,
    CheckoutCustomerSummary,
    CheckoutOrderSummary,
    CheckoutRead,
)

router = APIRouter(tags=["checkout"])


async def _get_valid_order(token: str, db: AsyncSession) -> Order:
    stmt = select(Order).where(Order.checkout_token == token)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Checkout link not found")

    if (
        order.checkout_token_expires_at is not None
        and order.checkout_token_expires_at < datetime.now(timezone.utc)
    ):
        raise HTTPException(status_code=410, detail="Checkout link has expired")

    return order


@router.get("/{token}", response_model=CheckoutRead)
async def get_checkout(token: str, db: AsyncSession = Depends(get_db)):
    order = await _get_valid_order(token, db)

    customer_summary = CheckoutCustomerSummary()
    if order.customer_id:
        customer = await db.get(Customer, order.customer_id)
        if customer:
            customer_summary = CheckoutCustomerSummary(name=customer.name, phone=customer.phone)

    return CheckoutRead(
        order=CheckoutOrderSummary(
            order_id=order.id,
            net_total_minor=order.net_total_minor,
            shipping_type=order.shipping_type,
            payment_method=order.payment_method,
            payment_status=order.payment_status,
        ),
        customer=customer_summary,
        token_expires_at=order.checkout_token_expires_at,
    )


@router.post("/{token}/address", response_model=CheckoutAddressResult)
async def submit_checkout_address(
    token: str, payload: CheckoutAddressSubmit, db: AsyncSession = Depends(get_db)
):
    order = await _get_valid_order(token, db)

    if order.customer_id:
        customer = await db.get(Customer, order.customer_id)
    else:
        customer = None

    if customer is None:
        customer = Customer(
            name=payload.name,
            phone=payload.phone,
            social_handle=payload.social_handle,
            pdpa_consent=False,
        )
        db.add(customer)
        await db.flush()  # obtain customer.id before assigning to order
        order.customer_id = customer.id
    else:
        customer.name = payload.name
        customer.phone = payload.phone
        customer.social_handle = payload.social_handle

    customer.address_subdistrict = payload.address_subdistrict
    customer.address_district = payload.address_district
    customer.address_province = payload.address_province

    await db.commit()
    return CheckoutAddressResult(ok=True, order_id=order.id)
