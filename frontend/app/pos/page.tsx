"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import { useRequireAuth } from "@/lib/auth";
import {
  createOrder,
  evaluatePromotions,
  formatMinor,
  listProducts,
  type Order,
  type PromotionResult,
  type Product,
} from "@/lib/api";

type CartLine = {
  product: Product;
  qty: number;
};

const SHIPPING_OPTIONS = [
  { type: "Normal", label: "Normal — ฿45", cost_minor: 4500 },
  { type: "Express", label: "Express — ฿89", cost_minor: 8900 },
  { type: "รับเองที่ร้าน", label: "รับเองที่ร้าน — ฟรี", cost_minor: 0 },
];

export default function PosPage() {
  const { ready } = useRequireAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [shippingIdx, setShippingIdx] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "card">("qr");
  const [promoResult, setPromoResult] = useState<PromotionResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Load the catalog once on mount.
  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch((err) => setLoadError(String(err)));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 6);
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 6);
  }, [products, query]);

  const subtotalMinor = useMemo(
    () => cart.reduce((sum, line) => sum + line.product.price_minor * line.qty, 0),
    [cart]
  );
  const shipping = SHIPPING_OPTIONS[shippingIdx];
  const discountMinor = promoResult?.total_discount_minor ?? 0;
  const netTotalMinor = Math.max(0, subtotalMinor - discountMinor) + shipping.cost_minor;

  // Re-evaluate promotions whenever the cart changes.
  useEffect(() => {
    if (cart.length === 0) {
      setPromoResult(null);
      return;
    }
    const cart_items = cart.map((line) => ({
      product_id: line.product.id,
      sku: line.product.sku,
      variant_attribute: line.product.variant_attribute,
      qty: line.qty,
      unit_price_minor: line.product.price_minor,
    }));
    const handle = setTimeout(() => {
      evaluatePromotions({ cart_items }).then(setPromoResult).catch(() => setPromoResult(null));
    }, 250);
    return () => clearTimeout(handle);
  }, [cart]);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  }

  async function confirmSale() {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await createOrder({
        channel: "pos",
        shipping_cost_minor: shipping.cost_minor,
        shipping_type: shipping.type,
        payment_method: paymentMethod,
        payment_status: "paid",
        line_items: cart.map((l) => ({
          product_id: l.product.id,
          qty: l.qty,
          unit_price_minor: l.product.price_minor,
        })),
      });
      setConfirmedOrder(order);
    } catch (err) {
      setSubmitError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  function newSale() {
    setCart([]);
    setPromoResult(null);
    setConfirmedOrder(null);
    setQuery("");
  }

  if (!ready) return null;

  if (confirmedOrder) {
    return <Receipt order={confirmedOrder} onNewSale={newSale} />;
  }

  return (
    <>
      <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-border bg-surface">
        <h1 className="font-display italic font-semibold text-lg m-0">Sell</h1>
        <span className="text-[10px] text-muted border border-border rounded px-1.5 py-0.5">
          e-receipt
        </span>
      </div>

      <div className="p-4 flex flex-col gap-4 flex-1">
        {loadError && (
          <div className="text-xs text-accent border border-accent rounded-lg px-3 py-2">
            Couldn&apos;t load products: {loadError}
          </div>
        )}

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาชื่อสินค้า หรือ SKU"
          className="h-[46px] rounded-lg border border-border bg-surface px-3.5 text-sm text-ink placeholder:text-muted outline-none focus:border-accent"
        />

        <div>
          <span className="text-[13px] font-semibold block mb-2">Results</span>
          <div className="flex gap-2.5 overflow-x-auto">
            {results.map((product) => (
              <div
                key={product.id}
                className="shrink-0 w-[120px] rounded-lg border border-border bg-surface p-2.5 flex flex-col gap-1.5"
              >
                <span className="text-xs font-medium line-clamp-2">{product.name}</span>
                <span className="text-xs text-muted">{formatMinor(product.price_minor)}</span>
                <button
                  type="button"
                  aria-label={`Add ${product.name}`}
                  onClick={() => addToCart(product)}
                  className="self-end w-11 h-11 -m-1 rounded-md bg-accent text-white flex items-center justify-center text-base font-semibold"
                >
                  +
                </button>
              </div>
            ))}
            {results.length === 0 && (
              <span className="text-xs text-muted py-2">No matching items.</span>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3.5">
          <span className="text-[13px] font-semibold block mb-1">Cart</span>
          {cart.length === 0 && (
            <span className="text-xs text-muted">Add items from Results above.</span>
          )}
          {cart.map((line) => (
            <div
              key={line.product.id}
              className="flex items-center justify-between gap-2.5 py-2.5 border-b border-border last:border-b-0"
            >
              <div>
                <div className="text-sm font-medium">{line.product.name}</div>
                <div className="text-[11px] text-muted">
                  {formatMinor(line.product.price_minor)} / unit
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Decrease ${line.product.name}`}
                  onClick={() => changeQty(line.product.id, -1)}
                  className="w-11 h-11 rounded-md border border-border bg-surface text-sm"
                >
                  −
                </button>
                <span className="w-4 text-center text-sm">{line.qty}</span>
                <button
                  type="button"
                  aria-label={`Increase ${line.product.name}`}
                  onClick={() => changeQty(line.product.id, 1)}
                  className="w-11 h-11 rounded-md border border-border bg-surface text-sm"
                >
                  +
                </button>
              </div>
              <div className="text-sm font-medium w-14 text-right">
                {formatMinor(line.product.price_minor * line.qty)}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2.5">
          {promoResult && promoResult.applied_promotions.length > 0 ? (
            <Badge tone="accent">
              Auto: {promoResult.applied_promotions.map((p) => p.name).join(", ")}
            </Badge>
          ) : (
            <span className="text-xs text-muted">No promotion applied</span>
          )}
        </div>

        <label className="rounded-lg border border-border bg-surface px-3 py-2.5 flex flex-col gap-0.5">
          <span className="text-[10px] text-muted">Shipping type</span>
          <select
            value={shippingIdx}
            onChange={(e) => setShippingIdx(Number(e.target.value))}
            className="text-[13px] font-medium bg-transparent outline-none -ml-0.5"
          >
            {SHIPPING_OPTIONS.map((opt, i) => (
              <option key={opt.type} value={i}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setPaymentMethod("qr")}
            className={`flex-1 py-3 text-sm font-medium ${
              paymentMethod === "qr" ? "bg-accent text-white" : "text-ink"
            }`}
          >
            QR
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("card")}
            className={`flex-1 py-3 text-sm font-medium ${
              paymentMethod === "card" ? "bg-accent text-white" : "text-ink"
            }`}
          >
            Card
          </button>
        </div>

        <div className="rounded-lg border border-border bg-surface p-3.5 flex flex-col gap-1">
          <div className="flex justify-between text-[13px] py-1">
            <span>Subtotal</span>
            <span>{formatMinor(subtotalMinor)}</span>
          </div>
          <div className="flex justify-between text-[13px] py-1">
            <span>Discount</span>
            <span>{discountMinor > 0 ? `−${formatMinor(discountMinor)}` : formatMinor(0)}</span>
          </div>
          <div className="flex justify-between text-[13px] py-1">
            <span>Shipping</span>
            <span>{formatMinor(shipping.cost_minor)}</span>
          </div>
          <div className="flex justify-between text-base font-bold pt-2 mt-1 border-t border-border">
            <span>Net total</span>
            <span>{formatMinor(netTotalMinor)}</span>
          </div>
        </div>

        {submitError && (
          <div className="text-xs text-accent border border-accent rounded-lg px-3 py-2">
            {submitError}
          </div>
        )}
      </div>

      <span className="text-[10px] text-muted italic px-4 pb-2">
        iOS PWA has limited offline support — this flow assumes connectivity.
      </span>

      <div className="sticky bottom-0 bg-surface border-t border-border p-3">
        <button
          type="button"
          disabled={cart.length === 0 || submitting}
          onClick={confirmSale}
          className="w-full h-[50px] rounded-lg bg-accent text-white text-[15px] font-semibold disabled:opacity-50"
        >
          {submitting ? "กำลังบันทึก…" : "ยืนยันการขาย"}
        </button>
      </div>
    </>
  );
}

function Receipt({ order, onNewSale }: { order: Order; onNewSale: () => void }) {
  return (
    <>
      <div className="h-14 shrink-0 flex items-center justify-center border-b border-border bg-surface">
        <h1 className="font-display italic font-semibold text-lg m-0">Sale confirmed</h1>
      </div>
      <div className="p-4 flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-surface p-5 flex flex-col gap-2.5">
          <span className="text-[13px] font-semibold">
            Order {order.id.slice(0, 8).toUpperCase()}
          </span>
          <span className="text-[11px] text-muted">
            {new Date(order.created_at).toLocaleString("th-TH")}
          </span>
          {order.line_items.map((li) => (
            <div
              key={li.id}
              className="flex justify-between text-[13px] py-1 border-b border-dashed border-border"
            >
              <span>
                {li.qty} × {formatMinor(li.unit_price_minor)}
              </span>
              <span>{formatMinor(li.unit_price_minor * li.qty)}</span>
            </div>
          ))}
          <div className="flex justify-between text-[13px] py-1 border-b border-dashed border-border">
            <span>Discount</span>
            <span>−{formatMinor(order.discount_amount_minor)}</span>
          </div>
          <div className="flex justify-between text-[13px] py-1 border-b border-dashed border-border">
            <span>Shipping</span>
            <span>{formatMinor(order.shipping_cost_minor)}</span>
          </div>
          <div className="flex justify-between text-[15px] font-bold pt-2 border-t border-border">
            <span>Net total</span>
            <span>{formatMinor(order.net_total_minor)}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onNewSale}
          className="w-full h-12 rounded-lg border border-ink text-sm font-medium bg-surface"
        >
          New sale
        </button>
      </div>
    </>
  );
}
