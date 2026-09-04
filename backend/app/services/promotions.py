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

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

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

    Full algorithm (steps 1-6 are implemented below; 7-8 are TODO):

    1. Gather candidate promotions: `status == "active"` AND today's date
       falls within `[start_date, end_date or infinity]`.
    2. Exclude coupon-gated promotions (`coupon_code IS NOT NULL`) unless
       the caller supplied a matching `coupon_code` that is:
         - within `[coupon_valid_from, coupon_valid_until]` (when set),
         - not exhausted (`coupon_redemption_count < coupon_redemption_limit_total`,
           when a total limit is set),
         - not exhausted per-customer (TODO: requires a redemption-history
           lookup keyed by customer_id + promotion_id — not implemented
           yet, see TODO below).
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
         - "bogo": for every `bogo_buy_qty` units of a qualifying line,
           discount `bogo_get_qty` units at `bogo_get_discount_pct`
           percent off their unit price. (TODO: current schema doesn't
           scope BOGO to a specific product/group — assumed to apply
           across the whole cart's cheapest eligible units at launch;
           needs product/group targeting to be fully correct.)
       Sum all surviving promotions' discounts into `total_discount_minor`.
    7. TODO: Coupon redemption bookkeeping — on successful order
       completion (not here, but downstream in routers/orders.py),
       increment `coupon_redemption_count` and record a per-customer
       redemption row so step 2's per-customer limit check has data to
       query against.
    8. TODO: Reward-coupon issuance — after totals are finalized
       (net_total_minor known), check every *active* promotion where
       `is_reward_coupon=False` but has a `reward_threshold_amount_minor`
       companion promotion (`reward_parent_promotion_id` pointing back to
       the qualifying promo) — if this order's net_total_minor crosses
       that threshold, generate a new single-use coupon `Promotion` row
       (is_reward_coupon=True) scoped to this customer's *next* order and
       set `PromotionResult.issued_reward_coupon_code` to it.

    Returns a PromotionResult with the promotions actually applied and the
    aggregate discount. Steps 1-3 (gathering + filtering candidates) and
    the percent/fixed discount math in step 6 are implemented; BOGO
    targeting, per-customer coupon limits, and reward-coupon issuance are
    left as explicit TODOs above and are not yet implemented.
    """
    now = now or datetime.now(timezone.utc)
    today = now.date()

    # --- Step 1: gather active, in-date-window candidates ---------------
    stmt = select(Promotion).where(Promotion.status == "active")
    result = await db.execute(stmt)
    candidates: list[Promotion] = [
        p
        for p in result.scalars().all()
        if p.start_date <= today and (p.end_date is None or today <= p.end_date)
    ]

    # --- Step 2: coupon gating -------------------------------------------
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
        # TODO: per-customer redemption limit check requires a redemption
        # history table keyed by (customer_id, promotion_id) — not
        # implemented yet. Currently NOT enforced.
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
            # TODO: BOGO not scoped to specific product/group — approximate
            # by applying across whole-cart cheapest eligible units.
            # Left intentionally simplistic; needs product/group targeting.
            discount = 0
            reason = "BOGO (not yet fully implemented)"
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
            )
        )

    # --- Steps 7 & 8: TODO — coupon redemption bookkeeping + reward-coupon
    # issuance. Not implemented; see docstring above.
    issued_reward_coupon_code = None

    return PromotionResult(
        applied_promotions=applied,
        total_discount_minor=total_discount,
        issued_reward_coupon_code=issued_reward_coupon_code,
    )
