"""Dashboard/analytics router.

Real aggregate SQL is used where the query is straightforward (sales
trend, channel breakdown, payment mix, top products, geography, gross
margin). Customer segmentation and promotion performance are returned as
clearly-shaped stub data — see TODOs below — since the business rules for
"segment" definitions weren't specified and would need more time to get
right than this scaffold pass allows.
"""

from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.models.order_line_item import OrderLineItem
from app.models.product import Product
from app.schemas.dashboard import (
    ChannelBreakdown,
    CustomerSegment,
    DashboardSummary,
    GeographyBreakdown,
    GrossMarginSummary,
    PaymentMixEntry,
    PromotionPerformance,
    SalesTrendPoint,
    TopProduct,
)

router = APIRouter(tags=["dashboard"])


async def _sales_trend(db: AsyncSession) -> list[SalesTrendPoint]:
    stmt = (
        select(
            func.date(Order.created_at).label("day"),
            func.coalesce(func.sum(Order.net_total_minor), 0).label("net_total_minor"),
            func.count(Order.id).label("order_count"),
        )
        .group_by("day")
        .order_by("day")
    )
    result = await db.execute(stmt)
    return [
        SalesTrendPoint(date=row.day, net_total_minor=row.net_total_minor, order_count=row.order_count)
        for row in result.all()
    ]


async def _top_products(db: AsyncSession, limit: int = 10) -> list[TopProduct]:
    stmt = (
        select(
            Product.id,
            Product.name,
            func.coalesce(func.sum(OrderLineItem.qty), 0).label("qty_sold"),
            func.coalesce(
                func.sum(OrderLineItem.qty * OrderLineItem.unit_price_minor), 0
            ).label("revenue_minor"),
        )
        .join(OrderLineItem, OrderLineItem.product_id == Product.id)
        .group_by(Product.id, Product.name)
        .order_by(func.sum(OrderLineItem.qty).desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    return [
        TopProduct(
            product_id=str(row.id), name=row.name, qty_sold=row.qty_sold, revenue_minor=row.revenue_minor
        )
        for row in result.all()
    ]


async def _channel_breakdown(db: AsyncSession) -> list[ChannelBreakdown]:
    stmt = select(
        Order.channel,
        func.count(Order.id).label("order_count"),
        func.coalesce(func.sum(Order.net_total_minor), 0).label("net_total_minor"),
    ).group_by(Order.channel)
    result = await db.execute(stmt)
    return [
        ChannelBreakdown(channel=row.channel, order_count=row.order_count, net_total_minor=row.net_total_minor)
        for row in result.all()
    ]


async def _payment_mix(db: AsyncSession) -> list[PaymentMixEntry]:
    stmt = select(
        Order.payment_method,
        func.count(Order.id).label("order_count"),
        func.coalesce(func.sum(Order.net_total_minor), 0).label("net_total_minor"),
    ).group_by(Order.payment_method)
    result = await db.execute(stmt)
    return [
        PaymentMixEntry(
            payment_method=row.payment_method,
            order_count=row.order_count,
            net_total_minor=row.net_total_minor,
        )
        for row in result.all()
    ]


async def _geography(db: AsyncSession) -> list[GeographyBreakdown]:
    stmt = (
        select(
            Customer.address_province,
            func.count(Order.id).label("order_count"),
            func.coalesce(func.sum(Order.net_total_minor), 0).label("net_total_minor"),
        )
        .join(Customer, Order.customer_id == Customer.id)
        .where(Customer.address_province.is_not(None))
        .group_by(Customer.address_province)
    )
    result = await db.execute(stmt)
    return [
        GeographyBreakdown(
            province=row.address_province, order_count=row.order_count, net_total_minor=row.net_total_minor
        )
        for row in result.all()
    ]


async def _gross_margin(db: AsyncSession) -> list[GrossMarginSummary]:
    stmt = (
        select(
            func.to_char(Order.created_at, "YYYY-MM").label("period"),
            func.coalesce(func.sum(OrderLineItem.qty * OrderLineItem.unit_price_minor), 0).label(
                "revenue_minor"
            ),
            func.coalesce(func.sum(OrderLineItem.qty * Product.cost_minor), 0).label("cost_minor"),
        )
        .join(OrderLineItem, OrderLineItem.order_id == Order.id)
        .join(Product, Product.id == OrderLineItem.product_id)
        .group_by("period")
        .order_by("period")
    )
    result = await db.execute(stmt)
    rows = result.all()
    out = []
    for row in rows:
        margin_pct = (
            ((row.revenue_minor - row.cost_minor) / row.revenue_minor * 100)
            if row.revenue_minor
            else 0.0
        )
        out.append(
            GrossMarginSummary(
                period=row.period,
                revenue_minor=row.revenue_minor,
                cost_minor=row.cost_minor,
                gross_margin_pct=round(margin_pct, 2),
            )
        )
    return out


def _customer_segments_stub() -> list[CustomerSegment]:
    # TODO: real segmentation rules (e.g. RFM analysis, VIP tag threshold,
    # new vs. returning by order count) haven't been specified yet.
    # Shape-correct placeholder data below.
    return [
        CustomerSegment(segment="VIP", customer_count=0, total_spent_minor=0),
        CustomerSegment(segment="returning", customer_count=0, total_spent_minor=0),
        CustomerSegment(segment="new", customer_count=0, total_spent_minor=0),
    ]


def _promotion_performance_stub() -> list[PromotionPerformance]:
    # TODO: real query would join orders.promotion_id -> promotions and
    # sum discount_amount_minor per promotion; deferred pending decision
    # on how to attribute *stacked* promotions (order currently stores a
    # single promotion_id, but apply_promotions() can return multiple
    # applied promotions — schema doesn't yet have an order_promotions
    # join table to attribute discounts per-promotion for stacked cases).
    return []


@router.get("", response_model=DashboardSummary)
async def get_dashboard(db: AsyncSession = Depends(get_db)):
    return DashboardSummary(
        sales_trend=await _sales_trend(db),
        top_products=await _top_products(db),
        customer_segments=_customer_segments_stub(),
        promotion_performance=_promotion_performance_stub(),
        channel_breakdown=await _channel_breakdown(db),
        geography=await _geography(db),
        payment_mix=await _payment_mix(db),
        gross_margin=await _gross_margin(db),
    )


@router.get("/sales-trend", response_model=list[SalesTrendPoint])
async def get_sales_trend(db: AsyncSession = Depends(get_db)):
    return await _sales_trend(db)


@router.get("/top-products", response_model=list[TopProduct])
async def get_top_products(db: AsyncSession = Depends(get_db), limit: int = Query(default=10, le=100)):
    return await _top_products(db, limit=limit)
