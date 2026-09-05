"""Import all models here so SQLAlchemy's mapper registry sees every table
and relationship string references (e.g. "OrderLineItem") resolve correctly
regardless of which module is imported first.
"""

from app.models.accounting_transaction import AccountingTransaction  # noqa: F401
from app.models.coupon_redemption import CouponRedemption  # noqa: F401
from app.models.customer import Customer  # noqa: F401
from app.models.order import Order  # noqa: F401
from app.models.order_line_item import OrderLineItem  # noqa: F401
from app.models.product import Product  # noqa: F401
from app.models.promotion import Promotion  # noqa: F401

__all__ = [
    "AccountingTransaction",
    "CouponRedemption",
    "Customer",
    "Order",
    "OrderLineItem",
    "Product",
    "Promotion",
]
