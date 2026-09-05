"""
Promotion evaluation engine.

This module is responsible for figuring out which promotions apply to a
cart at checkout time, and for the reward-coupon issuance that can be
triggered by a qualifying order. It is intentionally decoupled from
FastAPI/HTTP concerns — routers/promotions.py and routers/orders.py call
into `apply_promotions()` and pass the result into order-total computation.
"""

from dataclasses import dataclass, field
from datetime import date, datetime, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.coupon_redemption import CouponRedemption
from app.models.promotion import Promotion


@dataclass
class CartItem:
    """Minimal shape the engine needs per cart line — callers adapt their
    own cart/line-item representation into this before calling
    apply_promotions()."""

    product_id: UUID
    sku: str
    variant_attribute: str | None
    qty: int
    unit_price_minor: int


@dataclass
class AppliedPromotion:
    promotion_id: UUID
    name: str
    discount_minor: int
    reason: str  # short human-readable explanation, e.g. "10% off (auto)"
    # Set to the matched coupon code when this promotion was coupon-gated,
    # so callers (routers/orders.py) know which applied promotions need a
    # redemption recorded. None for non-coupon promotions.
    coupon_code: str | None = None


@dataclass
class PromotionResult:
    applied_promotions: list[AppliedPromotion] = field(default_factory=list)
    total_discount_minor: int = 0
    # Populated when a reward coupon is issued as a side effect of this
    # order qualifying (see step 8 below). None if no reward was triggered.
    issued_reward_coupon_code: str | None = None


async def apply_promotions(
    db: AsyncSession,
    cart_items: list[CartItem],
    customer_id: UUID | None,
    coupon_code: str | None = None,
    *,
    now: datetime | None = None,
) -> PromotionResult:
    """
    Evaluate all applicable promotions for a cart and compute the total
    discount, applying the project's stacking/priority rules.

    Full algorithm (steps 1-7 are implemented below; 8 is TODO):

    1. Gather candidate promotions: `status == "active"` AND today's date
       falls within `[start_date, end_date or infinity]`.
    2. Exclude coupon-gated promotions (`coupon_code IS NOT NULL`) unless
       the caller supplied a matching `coupon_code` that is:
         - within `[coupon_valid_from, coupon_valid_until]` (when set),
         - not exhausted (`coupon_redemption_count < coupon_redemption_limit_total`,
           when a total limit is set),
         - not exhausted per-customer (`coupon_redemption_limit_per_customer`,
           when set — enforced by counting `coupon_redemptions` rows for
           this `(promotion_id, customer_id)` pair; a null `customer_id`
           can't be matched against this limit, so guest orders only ever
           run into the total limit above).
       Promotions with no coupon_code are open to everyone and always pass
       this filter.
    3. For each remaining candidate, check `condition_type` against the
       cart:
         - "qty": total cart quantity >= min_value.
         - "amount": cart subtotal (sum of unit_price_minor * qty) >= min_value.
         - "variant": at least one cart line's `variant_attribute` matches
           the promotion's targeting (TODO: the current schema doesn't yet
           carry a target-variant value on Promotion beyond min_value/
           condition_type — needs a follow-up column or a join table to
           fully implement; treated as a pass-through TODO below).
       Promotions that don't meet their condition are dropped.
    4. Split survivors into auto-apply (`auto_apply=True`) and
       manual-selectable (`manual_selectable=True`) groups. Only
       auto-apply promotions (plus any promotion whose coupon_code the
       caller explicitly supplied) are actually evaluated for discount in
       this pass; manual-selectable ones are surfaced to the caller as
       *available* but require explicit selection by the cashier/customer
       (out of scope for this function's return value — TODO: add an
       `available_manual_promotions` field to PromotionResult once the
       UI flow for manual selection is defined).
    5. Non-stackable resolution: among the auto-apply (+ supplied coupon)
       survivors, if any are NOT stackable, only the single highest
       -`priority` non-stackable promotion is kept (ties broken by
       earliest `created_at`, i.e. first created wins). All `stackable`
       promotions are kept in addition to that one pick.
    6. Compute discount per surviving promotion:
         - "percent": `discount_type == "percent"` -> subtotal * (min_value / 100),
           or for BOGO see below.
         - "fixed": flat `min_value` (in minor units) off the subtotal,
           floored at 0.
         - "bogo": for every full cycle of `bogo_buy_qty + bogo_get_qty`
           units in the cart (`cart_qty // cycle_size`), discount
           `bogo_get_qty` units per cycle at `bogo_get_discount_pct`
           percent off their unit price, applied to the cart's cheapest
           eligible units. (Note: current schema doesn't scope BOGO to a
           specific product/group — it is assumed to apply across the
           whole cart's cheapest eligible units; needs product/group
           targeting to be fully correct.)
       Sum all surviving promotions' discounts into `total_discount_minor`.
    7. Coupon redemption bookkeeping — on successful order completion (not
       here, but downstream in routers/orders.py), `coupon_redemption_count`
       is incremented and a `coupon_redemptions` row is recorded per
       coupon-gated `AppliedPromotion` (see its `coupon_code` field), so
       step 2's per-customer limit check has data to query against.
    8. TODO: Reward-coupon issuance — after totals are finalized
       (net_total_minor known), check every *active* promotion where
       `is_reward_coupon=False` but has a `reward_threshold_amount_minor`
       companion promotion (`reward_parent_promotion_id` pointing back to
       the qualifying promo) — if this order's net_total_minor crosses
       that threshold, generate a new single-use coupon `Promotion` row
       (is_reward_coupon=True) scoped to this customer's *next* order and
       set `PromotionResult.issued_reward_coupon_code` to it.

    Returns a PromotionResult with the promotions actually applied and the
    aggregate discount. Steps 1-7 (gathering/filtering candidates,
    percent/fixed/bogo discount math, and coupon redemption bookkeeping)
    are implemented; reward-coupon issuance (step 8) is left as an explicit
    TODO above and is not yet implemented.
    """
    now = now or datetime.now(timezone.utc)
    today = now.date()

    # --- Step 1: gather active, in-date-window candidates ---------------
    stmt = select(Promotion).where(Promotion.status == "active")
    result = await db.execute(stmt)
    candidates: list[Promotion] = [
        p
        for p in result.scalars().all()
        if (p.start_date is None or p.start_date <= today)
        and (p.end_date is None or today <= p.end_date)
    ]

    # --- Step 2: coupon gating -------------------------------------------
    # Batch-fetch per-customer redemption counts up front for every
    # coupon-gated candidate that carries a per-customer limit, so
    # coupon_ok() below can stay a plain sync predicate. A null
    # customer_id can't be matched against a per-customer limit (guest
    # orders only run into coupon_redemption_limit_total, if set).
    per_customer_limit_promo_ids = [
        p.id
        for p in candidates
        if p.coupon_code is not None and p.coupon_redemption_limit_per_customer is not None
    ]
    redemption_counts: dict[UUID, int] = {}
    if customer_id is not None and per_customer_limit_promo_ids:
        redemption_stmt = (
            select(CouponRedemption.promotion_id, func.count())
            .where(
                CouponRedemption.promotion_id.in_(per_customer_limit_promo_ids),
                CouponRedemption.customer_id == customer_id,
            )
            .group_by(CouponRedemption.promotion_id)
        )
        redemption_result = await db.execute(redemption_stmt)
        redemption_counts = dict(redemption_result.all())

    def coupon_ok(promo: Promotion) -> bool:
        if promo.coupon_code is None:
            return True
        if coupon_code is None or promo.coupon_code != coupon_code:
            return False
        if promo.coupon_valid_from and now < promo.coupon_valid_from:
            return False
        if promo.coupon_valid_until and now > promo.coupon_valid_until:
            return False
        if (
            promo.coupon_redemption_limit_total is not None
            and promo.coupon_redemption_count >= promo.coupon_redemption_limit_total
        ):
            return False
        if (
            customer_id is not None
            and promo.coupon_redemption_limit_per_customer is not None
            and redemption_counts.get(promo.id, 0) >= promo.coupon_redemption_limit_per_customer
        ):
            return False
        return True

    candidates = [p for p in candidates if coupon_ok(p)]

    # --- Step 3: condition_type check against the cart -------------------
    cart_qty = sum(item.qty for item in cart_items)
    cart_subtotal_minor = sum(item.qty * item.unit_price_minor for item in cart_items)

    def condition_ok(promo: Promotion) -> bool:
        if promo.condition_type == "qty":
            return cart_qty >= (promo.min_value or 0)
        if promo.condition_type == "amount":
            return cart_subtotal_minor >= (promo.min_value or 0) * 100  # min_value assumed major units
        if promo.condition_type == "variant":
            # TODO: no explicit target-variant field on Promotion yet;
            # cannot be fully evaluated. Pass-through (does not exclude)
            # until the schema grows a target field.
            return True
        return False

    candidates = [p for p in candidates if condition_ok(p)]

    # --- Step 4: split auto-apply vs manual-selectable --------------------
    supplied_coupon_promo_ids = {p.id for p in candidates if p.coupon_code == coupon_code and coupon_code}
    auto_candidates = [
        p for p in candidates if p.auto_apply or p.id in supplied_coupon_promo_ids
    ]
    # manual_candidates = [p for p in candidates if p.manual_selectable]
    # TODO: surface manual_candidates to the caller once the UI selection
    # flow is defined (see PromotionResult TODO above).

    # --- Step 5: non-stackable resolution ---------------------------------
    stackable = [p for p in auto_candidates if p.stackable]
    non_stackable = [p for p in auto_candidates if not p.stackable]
    chosen: list[Promotion] = list(stackable)
    if non_stackable:
        best = sorted(
            non_stackable,
            key=lambda p: (-p.priority, p.created_at or datetime.min),
        )[0]
        chosen.append(best)

    # --- Step 6: compute discount per promotion ---------------------------
    applied: list[AppliedPromotion] = []
    total_discount = 0
    for promo in chosen:
        discount = 0
        if promo.discount_type == "percent":
            discount = int(cart_subtotal_minor * (float(promo.min_value or 0) / 100))
            reason = f"{promo.min_value}% off (auto)"
        elif promo.discount_type == "fixed":
            discount = int((promo.min_value or 0) * 100)  # assume min_value major units
            reason = f"{promo.min_value} fixed off (auto)"
        elif promo.discount_type == "bogo":
            # BOGO not scoped to a specific product/group by the current
            # schema — approximate by applying across the whole cart's
            # cheapest eligible units. Needs product/group targeting to be
            # fully correct; see docstring step 6.
            buy_qty = promo.bogo_buy_qty or 0
            get_qty = promo.bogo_get_qty or 0
            if buy_qty <= 0 or get_qty <= 0:
                discount = 0
            else:
                cycle_size = buy_qty + get_qty
                num_cycles = cart_qty // cycle_size
                discounted_unit_count = num_cycles * get_qty
                unit_prices = sorted(
                    item.unit_price_minor for item in cart_items for _ in range(item.qty)
                )
                discounted_unit_count = min(discounted_unit_count, len(unit_prices))
                pct = float(promo.bogo_get_discount_pct or 0)
                discount = sum(
                    int(price * (pct / 100)) for price in unit_prices[:discounted_unit_count]
                )
            reason = (
                f"Buy {promo.bogo_buy_qty} get {promo.bogo_get_qty} at "
                f"{promo.bogo_get_discount_pct}% off (auto)"
            )
        else:
            reason = "unknown discount_type"

        discount = max(0, min(discount, cart_subtotal_minor - total_discount))
        total_discount += discount
        applied.append(
            AppliedPromotion(
                promotion_id=promo.id,
                name=promo.name,
                discount_minor=discount,
                reason=reason,
                coupon_code=promo.coupon_code,
            )
        )

    # --- Step 7: coupon redemption bookkeeping happens downstream, in
    # routers/orders.py, once the order actually commits (see docstring).
    # --- Step 8: TODO — reward-coupon issuance. Not implemented; see
    # docstring above.
    issued_reward_coupon_code = None

    return PromotionResult(
        applied_promotions=applied,
        total_discount_minor=total_discount,
        issued_reward_coupon_code=issued_reward_coupon_code,
    )
