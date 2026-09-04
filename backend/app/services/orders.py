"""Order service-layer logic.

Houses business rules that must not be bypassable from routers/schemas
alone — in particular, shipping_status auto-derivation.
"""

from app.models.order import Order


def set_tracking_number(order: Order, tracking_number: str | None) -> Order:
    """
    Set an order's tracking number and enforce the shipping_status
    invariant: shipping_status becomes "shipped" the moment a
    tracking_number is set, and is never accepted directly from client
    input. Clearing the tracking number (None) reverts to "new_order".

    This is the ONLY sanctioned way to change shipping_status — routers
    must call this instead of setting `order.shipping_status` directly.
    """
    order.tracking_number = tracking_number
    order.shipping_status = "shipped" if tracking_number else "new_order"
    return order


def compute_totals(
    subtotal_minor: int, shipping_cost_minor: int, discount_amount_minor: int
) -> int:
    """Compute net_total_minor from the component minor-unit amounts."""
    return max(0, subtotal_minor + shipping_cost_minor - discount_amount_minor)
