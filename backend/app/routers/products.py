"""Products router — CRUD against the `products` table.

This is the simplest CRUD case in the scaffold and is wired up to run real
queries against the DB (not static stub data), per the project brief.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.services.products import compute_margin_and_profit, compute_status

router = APIRouter(tags=["products"])


@router.get("", response_model=list[ProductRead])
async def list_products(
    db: AsyncSession = Depends(get_db),
    group_name: str | None = Query(default=None),
    variant_attribute: str | None = Query(default=None),
    status: str | None = Query(default=None),
    vendor: str | None = Query(default=None),
):
    stmt = select(Product)
    if group_name:
        stmt = stmt.where(Product.group_name == group_name)
    if variant_attribute:
        stmt = stmt.where(Product.variant_attribute == variant_attribute)
    if status:
        stmt = stmt.where(Product.status == status)
    if vendor:
        stmt = stmt.where(Product.vendor == vendor)
    stmt = stmt.order_by(Product.created_at.desc())

    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{product_id}", response_model=ProductRead)
async def get_product(product_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    product = await db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("", response_model=ProductRead, status_code=201)
async def create_product(payload: ProductCreate, db: AsyncSession = Depends(get_db)):
    margin_pct, profit_minor = compute_margin_and_profit(payload.cost_minor, payload.price_minor)
    product = Product(
        **payload.model_dump(),
        margin_pct=margin_pct,
        profit_minor=profit_minor,
        status=compute_status(payload.stock_quantity, payload.low_stock_threshold),
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.patch("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: uuid.UUID, payload: ProductUpdate, db: AsyncSession = Depends(get_db)
):
    """Inline-edit use case: partial update of one or more fields."""
    product = await db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(product, field, value)

    # Recompute margin/profit if cost or price changed.
    if "cost_minor" in updates or "price_minor" in updates:
        margin_pct, profit_minor = compute_margin_and_profit(product.cost_minor, product.price_minor)
        product.margin_pct = margin_pct
        product.profit_minor = profit_minor

    # Recompute status if stock quantity or threshold changed.
    if "stock_quantity" in updates or "low_stock_threshold" in updates:
        product.status = compute_status(product.stock_quantity, product.low_stock_threshold)

    await db.commit()
    await db.refresh(product)
    return product
