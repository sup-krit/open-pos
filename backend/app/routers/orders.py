"""Orders router — list/get/create orders, and the tracking-number PATCH
that auto-derives shipping_status via the service layer.
"""

import secrets
import uuid
from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.session import get_db
from app.models.coupon_redemption import CouponRedemption
from app.models.order import Order
from app.models.order_line_item import OrderLineItem
from app.models.product import Product
from app.models.promotion import Promotion
from app.schemas.order import OrderCreate, OrderRead, OrderUpdate
from app.services import orders as orders_service
from app.services.products import compute_status
from app.services.promotions import CartItem, apply_promotions

router = APIRouter(tags=["orders"])


@router.get("", response_model=list[OrderRead])
async def list_orders(
    db: AsyncSession = Depends(get_db),
    shipping_status: str | None = Query(default=None),
    payment_status: str | None = Query(default=None),
    channel: str | None = Query(default=None),
    date_from: date | None = Query(default=None),
    date_to: date | None = Query(default=None),
):
    stmt = select(Order).options(selectinload(Order.line_items))
    if shipping_status:
        stmt = stmt.where(Order.shipping_status == shipping_status)
    if payment_status:
        stmt = stmt.where(Order.payment_status == payment_status)
    if channel:
        stmt = stmt.where(Order.channel == channel)
    if date_from:
        stmt = stmt.where(Order.created_at >= date_from)
    if date_to:
        stmt = stmt.where(Order.created_at <= date_to)
    stmt = stmt.order_by(Order.created_at.desc())

    result = await db.execute(stmt)
    return result.scalars().unique().all()


@router.get("/{order_id}", response_model=OrderRead)
async def get_order(order_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Order)
        .options(selectinload(Order.line_items))
        .where(Order.id == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("", response_model=OrderRead, status_code=201)
async def create_order(payload: OrderCreate, db: AsyncSession = Depends(get_db)):
    subtotal_minor = sum(li.qty * li.unit_price_minor for li in payload.line_items)

    cart_items = [
        CartItem(
            product_id=li.product_id,
            sku="",  # TODO: hydrate from product lookup if promotion rules need it
            variant_attribute=None,
            qty=li.qty,
            unit_price_minor=li.unit_price_minor,
        )
        for li in payload.line_items
    ]
    promo_result = await apply_promotions(
        db, cart_items, payload.customer_id, coupon_code=payload.coupon_code
    )
    discount_amount_minor = promo_result.total_discount_minor
    net_total_minor = orders_service.compute_totals(
        subtotal_minor, payload.shipping_cost_minor, discount_amount_minor
    )

    applied_promotion_id = (
        promo_result.applied_promotions[0].promotion_id
        if promo_result.applied_promotions
        else None
    )

    order = Order(
        channel=payload.channel,
        customer_id=payload.customer_id,
        subtotal_minor=subtotal_minor,
        shipping_cost_minor=payload.shipping_cost_minor,
        discount_amount_minor=discount_amount_minor,
        net_total_minor=net_total_minor,
        promotion_id=applied_promotion_id,
        shipping_type=payload.shipping_type,
        payment_method=payload.payment_method,
        payment_status=payload.payment_status,
        checkout_token=secrets.token_urlsafe(24),
        checkout_token_expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    order.line_items = [
        OrderLineItem(
            product_id=li.product_id, qty=li.qty, unit_price_minor=li.unit_price_minor
        )
        for li in payload.line_items
    ]

    # Decrement stock for each line item's product and re-derive its status.
    # No row locking / concurrency handling — out of scope for this
    # single-shop, low-concurrency app.
    for li in payload.line_items:
        product = await db.get(Product, li.product_id)
        if product is not None:
            product.stock_quantity = max(0, product.stock_quantity - li.qty)
            product.status = compute_status(product.stock_quantity, product.low_stock_threshold)

    db.add(order)
    await db.commit()
    await db.refresh(order, attribute_names=["line_items"])

    # Coupon redemption bookkeeping — see services/promotions.py step 7.
    # Covers every coupon-gated applied promotion (stacking may apply more
    # than one), not just the promotion recorded on order.promotion_id.
    coupon_applied = [ap for ap in promo_result.applied_promotions if ap.coupon_code is not None]
    if coupon_applied:
        for applied in coupon_applied:
            promo = await db.get(Promotion, applied.promotion_id)
            if promo is not None:
                promo.coupon_redemption_count += 1
            db.add(
                CouponRedemption(
                    promotion_id=applied.promotion_id,
                    customer_id=payload.customer_id,
                    order_id=order.id,
                )
            )
        await db.commit()

    return order


@router.patch("/{order_id}", response_model=OrderRead)
async def update_order(
    order_id: uuid.UUID, payload: OrderUpdate, db: AsyncSession = Depends(get_db)
):
    """
    Patch an order. `tracking_number` is the only field that drives
    shipping_status — setting it always flips shipping_status to
    "shipped" via services/orders.set_tracking_number(). shipping_status
    itself can never be set directly (it isn't even present on
    OrderUpdate).
    """
    stmt = (
        select(Order)
        .options(selectinload(Order.line_items))
        .where(Order.id == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    updates = payload.model_dump(exclude_unset=True)

    if "tracking_number" in updates:
        orders_service.set_tracking_number(order, updates["tracking_number"])

    if "payment_status" in updates:
        order.payment_status = updates["payment_status"]

    await db.commit()
    await db.refresh(order, attribute_names=["line_items"])
    return order
