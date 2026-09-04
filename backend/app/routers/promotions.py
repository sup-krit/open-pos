"""Promotions router.

Activation (flipping `status`) is owner/admin-gated per project
requirements — that specific path mounts require_role("owner_admin").
General create/update of promotion configuration does not (any staff can
draft a promotion; only an owner/admin can turn it live).
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import CurrentUser, require_role
from app.db.session import get_db
from app.models.promotion import Promotion
from app.schemas.promotion import PromotionCreate, PromotionRead, PromotionUpdate
from app.services.promotions import CartItem, PromotionResult, apply_promotions

router = APIRouter(tags=["promotions"])


@router.get("", response_model=list[PromotionRead])
async def list_promotions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Promotion).order_by(Promotion.priority.desc()))
    return result.scalars().all()


@router.get("/{promotion_id}", response_model=PromotionRead)
async def get_promotion(promotion_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    promotion = await db.get(Promotion, promotion_id)
    if promotion is None:
        raise HTTPException(status_code=404, detail="Promotion not found")
    return promotion


@router.post("", response_model=PromotionRead, status_code=201)
async def create_promotion(payload: PromotionCreate, db: AsyncSession = Depends(get_db)):
    promotion = Promotion(**payload.model_dump())
    db.add(promotion)
    await db.commit()
    await db.refresh(promotion)
    return promotion


@router.patch("/{promotion_id}", response_model=PromotionRead)
async def update_promotion(
    promotion_id: uuid.UUID, payload: PromotionUpdate, db: AsyncSession = Depends(get_db)
):
    """
    General config update. `status` is intentionally excluded here at the
    application level for the activation flow — see PATCH
    /{promotion_id}/status below, which is the owner/admin-gated path.
    If `status` is included in the payload it is still applied (this
    endpoint isn't the enforcement boundary by itself); the dedicated
    activation endpoint below is the one that carries the role gate.
    """
    promotion = await db.get(Promotion, promotion_id)
    if promotion is None:
        raise HTTPException(status_code=404, detail="Promotion not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(promotion, field, value)

    await db.commit()
    await db.refresh(promotion)
    return promotion


class PromotionStatusUpdate(BaseModel):
    status: str  # "active" | "inactive"


@router.patch("/{promotion_id}/status", response_model=PromotionRead)
async def set_promotion_status(
    promotion_id: uuid.UUID,
    payload: PromotionStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_role("owner_admin")),
):
    """Activation/deactivation path — owner/admin only."""
    promotion = await db.get(Promotion, promotion_id)
    if promotion is None:
        raise HTTPException(status_code=404, detail="Promotion not found")
    promotion.status = payload.status
    await db.commit()
    await db.refresh(promotion)
    return promotion


class EvaluateCartLine(BaseModel):
    product_id: uuid.UUID
    sku: str = ""
    variant_attribute: str | None = None
    qty: int
    unit_price_minor: int


class EvaluateRequest(BaseModel):
    cart_items: list[EvaluateCartLine]
    customer_id: uuid.UUID | None = None
    coupon_code: str | None = None


@router.post("/evaluate", response_model=None)
async def evaluate_promotions(
    payload: EvaluateRequest, db: AsyncSession = Depends(get_db)
) -> PromotionResult:
    """Dry-run promotion evaluation for a given cart (no order is created)."""
    cart_items = [
        CartItem(
            product_id=line.product_id,
            sku=line.sku,
            variant_attribute=line.variant_attribute,
            qty=line.qty,
            unit_price_minor=line.unit_price_minor,
        )
        for line in payload.cart_items
    ]
    return await apply_promotions(
        db, cart_items, payload.customer_id, coupon_code=payload.coupon_code
    )
