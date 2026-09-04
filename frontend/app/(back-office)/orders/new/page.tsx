"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Topbar from "@/components/shell/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  createOrder,
  formatMinor,
  listCustomers,
  listProducts,
  type Customer,
  type Order,
  type Product,
} from "@/lib/api";

const SHIPPING_OPTIONS = [
  { type: "Normal", label: "Normal — ฿45", cost_minor: 4500 },
  { type: "Express", label: "Express — ฿89", cost_minor: 8900 },
  { type: "รับเองที่ร้าน", label: "รับเองที่ร้าน — ฟรี", cost_minor: 0 },
];

type CartLine = { product: Product; qty: number };

export default function NewOrderPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [shippingIdx, setShippingIdx] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"qr" | "card">("qr");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  useEffect(() => {
    Promise.all([listCustomers(), listProducts()])
      .then(([c, p]) => {
        setCustomers(c);
        setProducts(p);
      })
      .catch((err) => setLoadError(String(err)));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 8);
  }, [products, query]);

  const subtotalMinor = useMemo(
    () => cart.reduce((sum, l) => sum + l.product.price_minor * l.qty, 0),
    [cart]
  );
  const shipping = SHIPPING_OPTIONS[shippingIdx];
  const netTotalMinor = subtotalMinor + shipping.cost_minor;

  function addLine(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) => (l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l));
      }
      return [...prev, { product, qty: 1 }];
    });
    setQuery("");
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function changeQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.product.id === productId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  }

  async function submit() {
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const order = await createOrder({
        channel: "store",
        customer_id: customerId || null,
        shipping_cost_minor: shipping.cost_minor,
        shipping_type: shipping.type,
        payment_method: paymentMethod,
        payment_status: "unpaid",
        line_items: cart.map((l) => ({
          product_id: l.product.id,
          qty: l.qty,
          unit_price_minor: l.product.price_minor,
        })),
      });
      setCreatedOrder(order);
    } catch (err) {
      setSubmitError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (createdOrder) {
    return (
      <>
        <Topbar title="Order created" />
        <div className="p-8 max-w-lg flex flex-col gap-4">
          <Card className="p-5 flex flex-col gap-2">
            <span className="text-sm font-semibold">
              Order {createdOrder.id.slice(0, 8).toUpperCase()} created
            </span>
            <span className="text-sm text-muted">
              Net total: {formatMinor(createdOrder.net_total_minor)}
            </span>
          </Card>
          <div className="text-xs text-muted italic border border-border rounded-md p-3">
            Customer address-entry link and payment QR generation aren&apos;t implemented on the
            backend yet (no checkout-token issuance on order creation) — this order was created
            without one. See <code>docs/progress-log.md</code>.
          </div>
          <div className="flex gap-3">
            <Link href={`/orders/${createdOrder.id}`}>
              <Button>View order</Button>
            </Link>
            <Link href="/orders">
              <Button variant="secondary">Back to Orders</Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="เพิ่มออร์เดอร์" />
      <div className="p-8 flex flex-col gap-6 max-w-4xl">
        {loadError && <div className="text-xs text-accent">Couldn&apos;t load data: {loadError}</div>}

        <Card className="p-5 flex flex-col gap-4">
          <span className="text-sm font-semibold">Customer</span>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="h-9 rounded-md border border-border px-3 text-sm text-ink bg-surface w-64"
          >
            <option value="">Guest (no customer)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Card>

        <Card className="p-5 flex flex-col gap-3">
          <span className="text-sm font-semibold">Items</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product name or SKU"
            className="h-9 rounded-md border border-border px-3 text-sm text-ink bg-surface"
          />
          {results.length > 0 && (
            <div className="flex flex-col border border-border rounded-md divide-y divide-border">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addLine(p)}
                  className="flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-paper"
                >
                  <span>{p.name}</span>
                  <span className="text-muted">{formatMinor(p.price_minor)}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 mt-1">
            {cart.length === 0 && <span className="text-xs text-muted">No items added yet.</span>}
            {cart.map((line) => (
              <div
                key={line.product.id}
                className="flex items-center justify-between gap-3 border border-border rounded-md px-3 py-2 bg-paper"
              >
                <div className="flex items-baseline gap-2 text-sm">
                  <span className="font-medium">{line.product.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => changeQty(line.product.id, -1)}
                    className="w-7 h-7 rounded-md border border-border text-sm"
                  >
                    −
                  </button>
                  <span className="text-sm w-4 text-center">{line.qty}</span>
                  <button
                    type="button"
                    onClick={() => changeQty(line.product.id, 1)}
                    className="w-7 h-7 rounded-md border border-border text-sm"
                  >
                    +
                  </button>
                  <span className="text-sm w-16 text-right">
                    {formatMinor(line.product.price_minor * line.qty)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${line.product.name}`}
                    onClick={() => removeLine(line.product.id)}
                    className="w-5 h-5 flex items-center justify-center rounded-full border border-border text-muted text-xs"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-6">
          <Card className="p-5 flex flex-col gap-4 flex-1">
            <span className="text-sm font-semibold">Shipping &amp; payment</span>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                Shipping type
                <select
                  value={shippingIdx}
                  onChange={(e) => setShippingIdx(Number(e.target.value))}
                  className="h-9 rounded-md border border-border px-3 text-sm text-ink bg-surface"
                >
                  {SHIPPING_OPTIONS.map((opt, i) => (
                    <option key={opt.type} value={i}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                Payment method
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as "qr" | "card")}
                  className="h-9 rounded-md border border-border px-3 text-sm text-ink bg-surface"
                >
                  <option value="qr">QR / PromptPay</option>
                  <option value="card">Card</option>
                </select>
              </label>
            </div>
          </Card>

          <Card className="p-5 flex flex-col w-[280px] shrink-0">
            <span className="text-sm font-semibold mb-1">Totals</span>
            <div className="flex justify-between text-[13px] py-1">
              <span>Subtotal</span>
              <span>{formatMinor(subtotalMinor)}</span>
            </div>
            <div className="flex justify-between text-[13px] py-1">
              <span>Shipping</span>
              <span>{formatMinor(shipping.cost_minor)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 mt-1 border-t border-border">
              <span>Net total</span>
              <span>{formatMinor(netTotalMinor)}</span>
            </div>
          </Card>
        </div>

        {submitError && <div className="text-xs text-accent">{submitError}</div>}

        <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
          <Link href="/orders">
            <Button variant="ghost">Cancel</Button>
          </Link>
          <Button variant="primary" onClick={submit} disabled={cart.length === 0 || submitting}>
            {submitting ? "Creating…" : "Submit"}
          </Button>
        </div>
      </div>
    </>
  );
}
