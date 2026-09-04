"""FastAPI application entrypoint."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import (
    accounting,
    checkout,
    customers,
    dashboard,
    orders,
    products,
    promotions,
)

app = FastAPI(title="Open POS API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(products.router, prefix="/api/products")
app.include_router(orders.router, prefix="/api/orders")
app.include_router(customers.router, prefix="/api/customers")
app.include_router(promotions.router, prefix="/api/promotions")
app.include_router(accounting.router, prefix="/api/accounting")
app.include_router(dashboard.router, prefix="/api/dashboard")
app.include_router(checkout.router, prefix="/checkout")
