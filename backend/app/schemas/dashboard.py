"""Pydantic schemas for dashboard/analytics KPI shapes (routers/dashboard.py).

Some of these are backed by real aggregate SQL (documented per-field),
others are clearly-shaped stub data pending further implementation time —
see routers/dashboard.py for which is which.
"""

from datetime import date

from pydantic import BaseModel


class SalesTrendPoint(BaseModel):
    date: date
    net_total_minor: int
    order_count: int


class TopProduct(BaseModel):
    product_id: str
    name: str
    qty_sold: int
    revenue_minor: int


class CustomerSegment(BaseModel):
    segment: str  # e.g. "VIP", "new", "returning"
    customer_count: int
    total_spent_minor: int


class PromotionPerformance(BaseModel):
    promotion_id: str
    name: str
    times_applied: int
    total_discount_minor: int


class ChannelBreakdown(BaseModel):
    channel: str
    order_count: int
    net_total_minor: int


class GeographyBreakdown(BaseModel):
    province: str
    order_count: int
    net_total_minor: int


class PaymentMixEntry(BaseModel):
    payment_method: str
    order_count: int
    net_total_minor: int


class GrossMarginSummary(BaseModel):
    period: str  # "YYYY-MM"
    revenue_minor: int
    cost_minor: int
    gross_margin_pct: float


class DashboardSummary(BaseModel):
    sales_trend: list[SalesTrendPoint]
    top_products: list[TopProduct]
    customer_segments: list[CustomerSegment]
    promotion_performance: list[PromotionPerformance]
    channel_breakdown: list[ChannelBreakdown]
    geography: list[GeographyBreakdown]
    payment_mix: list[PaymentMixEntry]
    gross_margin: list[GrossMarginSummary]
