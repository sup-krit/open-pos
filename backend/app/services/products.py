"""Product service-layer logic.

Houses business rules that must not be bypassable from routers/schemas
alone — in particular, `status` auto-derivation from stock quantity.
"""


def compute_status(stock_quantity: int, low_stock_threshold: int) -> str:
    """
    Derive a product's status from its stock quantity vs. its low-stock
    threshold. This is the ONLY sanctioned way to set `status` — routers
    must call this instead of setting `product.status` directly.
    """
    if stock_quantity <= 0:
        return "out_of_stock"
    if stock_quantity <= low_stock_threshold:
        return "low_stock"
    return "in_stock"


def compute_margin_and_profit(cost_minor: int, price_minor: int) -> tuple[float, int]:
    """Derive margin_pct and profit_minor from cost/price (both minor units)."""
    profit_minor = price_minor - cost_minor
    margin_pct = (profit_minor / price_minor * 100) if price_minor else 0.0
    return round(margin_pct, 4), profit_minor
