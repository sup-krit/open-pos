"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Topbar from "@/components/shell/Topbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  formatMinor,
  getOrder,
  listCustomers,
  listProducts,
  listPromotions,
  updateOrder,
  type Customer,
  type Order,
  type Product,
  type Promotion,
} from "@/lib/api";

const PAYMENT_LABEL: Record<Order["payment_status"], string> = {
  paid: "ชำระแล้ว",
  unpaid: "รอชำระ",
  deposit: "มัดจำ",
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tracking, setTracking] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<Order["payment_status"]>("unpaid");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([getOrder(orderId), listCustomers(), listProducts(), listPromotions()])
      .then(([o, c, p, promo]) => {
        setOrder(o);
        setCustomers(c);
        setProducts(p);
        setPromotions(promo);
        setTracking(o.tracking_number ?? "");
        setPaymentStatus(o.payment_status);
      })
      .catch((err) => setLoadError(String(err)));
  }, [orderId]);

  const productName = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p.name]));
    return (id: string) => map.get(id) ?? "(unknown product)";
  }, [products]);

  const customerName = order?.customer_id
    ? customers.find((c) => c.id === order.customer_id)?.name ?? "—"
    : "Guest";

  const promotionName = order?.promotion_id
    ? promotions.find((p) => p.id === order.promotion_id)?.name ?? null
    : null;

  async function save() {
    if (!order) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateOrder(order.id, {
        tracking_number: tracking || null,
        payment_status: paymentStatus,
      });
      setOrder(updated);
      setSavedAt(Date.now());
    } catch (err) {
      setSaveError(String(err));
    } finally {
      setSaving(false);
    }
  }

  if (loadError) {
    return (
      <>
        <Topbar title="Order" />
        <div className="p-8 text-sm text-accent">Couldn&apos;t load this order: {loadError}</div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Topbar title="Order" />
        <div className="p-8 text-sm text-muted">Loading…</div>
      </>
    );
  }

  return (
    <>
      <Topbar
        title={`Order ${order.id.slice(0, 8).toUpperCase()}`}
        actions={
          <>
            <Badge tone={order.payment_status === "paid" ? "accent" : "neutral"}>
              {PAYMENT_LABEL[order.payment_status]}
            </Badge>
            <Badge tone={order.shipping_status === "shipped" ? "ink" : "neutral"}>
              {order.shipping_status === "shipped" ? "Shipped" : "New Order"}
            </Badge>
          </>
        }
      />
      <div className="p-8 flex flex-col gap-6 max-w-4xl">
        <Card className="p-5 flex flex-col">
          <span className="text-sm font-semibold mb-3">Line items</span>
          <div className="flex flex-col gap-2">
            {order.line_items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 border border-border rounded-md px-3 py-2 bg-paper"
              >
                <div className="flex items-baseline gap-2 text-sm">
                  <span className="font-medium">{productName(item.product_id)}</span>
                  <span className="text-xs text-muted">× {item.qty}</span>
                </div>
                <span className="text-sm">{formatMinor(item.unit_price_minor * item.qty)}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex gap-6">
          <Card className="p-5 flex flex-col gap-4 flex-1">
            <span className="text-sm font-semibold">Fulfillment</span>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                Customer
                <span className="h-9 flex items-center px-3 rounded-md border border-border bg-paper text-sm text-ink">
                  {customerName}
                </span>
              </label>
              <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                Tracking number
                <input
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="e.g. TH482910"
                  className="h-9 rounded-md border border-border px-3 text-sm text-ink bg-surface"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                Payment status
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as Order["payment_status"])}
                  className="h-9 rounded-md border border-border px-3 text-sm text-ink bg-surface"
                >
                  <option value="unpaid">รอชำระ</option>
                  <option value="paid">ชำระแล้ว</option>
                  <option value="deposit">มัดจำ</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-[11px] text-muted">
                Shipping type
                <span className="h-9 flex items-center px-3 rounded-md border border-border bg-paper text-sm text-ink">
                  {order.shipping_type}
                </span>
              </label>
            </div>

            <span className="text-sm font-semibold mt-2">Promotion</span>
            {promotionName ? (
              <Badge tone="accent">{promotionName}</Badge>
            ) : (
              <span className="text-xs text-muted">No promotion applied</span>
            )}
          </Card>

          <Card className="p-5 flex flex-col w-[280px] shrink-0">
            <span className="text-sm font-semibold mb-1">Totals</span>
            <div className="flex justify-between text-[13px] py-1">
              <span>Subtotal</span>
              <span>{formatMinor(order.subtotal_minor)}</span>
            </div>
            <div className="flex justify-between text-[13px] py-1">
              <span>Discount</span>
              <span>−{formatMinor(order.discount_amount_minor)}</span>
            </div>
            <div className="flex justify-between text-[13px] py-1">
              <span>Shipping</span>
              <span>{formatMinor(order.shipping_cost_minor)}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 mt-1 border-t border-border">
              <span>Net total</span>
              <span>{formatMinor(order.net_total_minor)}</span>
            </div>
          </Card>
        </div>

        {saveError && <div className="text-xs text-accent">{saveError}</div>}
        {savedAt && !saveError && <div className="text-xs text-muted">Saved.</div>}

        <div className="flex items-center justify-between border-t border-border pt-5">
          <div className="flex gap-3">
            <Button
              variant="secondary"
              disabled
              title="Shipping label generation isn't implemented yet"
            >
              Shipping label
            </Button>
            <Button variant="secondary" disabled title="Payment QR generation isn't implemented yet">
              Payment QR
            </Button>
          </div>
          <div className="flex gap-3">
            <Link href="/orders">
              <Button variant="ghost">Back to Orders</Button>
            </Link>
            <Button variant="primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
